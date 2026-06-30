import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { isAiConfigured } from '@/lib/activation';
import {
  buildCopilotSystemPrompt,
  capHistory,
  checkRateLimit,
  COPILOT_LIMITS,
  COPILOT_TOOLS,
  recordLatency,
  recordTokenCost,
  recordToolError,
  recordToolInvocation,
  redactPii,
  runTool,
  sanitizeUserMessage,
  snapshot,
  type ChatTurn,
} from '@/lib/copilot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(COPILOT_LIMITS.maxCharsPerMessage),
      }),
    )
    .min(1)
    .max(COPILOT_LIMITS.maxMessages),
});

const MODEL =
  process.env.ANTHROPIC_MODEL_REASONING || 'claude-haiku-4-5-20251001';

/** Max tool→answer round-trips before we stop (cost + latency guard). */
const MAX_TOOL_STEPS = 4;

/**
 * Anthropic tool definitions, derived once from the typed COPILOT_TOOLS registry
 * (Feature 4 · P1). Each zod input schema becomes a JSON Schema the model can
 * call against; runTool re-validates the model's arguments before execution.
 */
const TOOL_DEFS: Anthropic.Tool[] = COPILOT_TOOLS.map((t) => {
  const schema = zodToJsonSchema(t.inputSchema, {
    $refStrategy: 'none',
  }) as Record<string, unknown>;
  delete schema.$schema;
  return {
    name: t.name,
    description: t.description,
    input_schema: schema as Anthropic.Tool.InputSchema,
  };
});

function clientKey(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anon'
  );
}

/**
 * Safety pass (Feature 4): redact PII from every user turn (privacy before the
 * message hits the model or any log) and wrap the active turn if it looks like a
 * prompt-injection attempt. Assistant turns pass through untouched.
 */
function prepareMessages(
  messages: { role: 'user' | 'assistant'; content: string }[],
): Anthropic.MessageParam[] {
  const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user');
  const cleaned: ChatTurn[] = messages.map((m, i) => {
    if (m.role !== 'user') return { role: m.role, content: m.content };
    const redacted = redactPii(m.content).text;
    const safe =
      i === lastUserIdx ? sanitizeUserMessage(redacted).text : redacted;
    return { role: 'user', content: safe };
  });
  return capHistory(cleaned).map((t) => ({ role: t.role, content: t.content }));
}

/**
 * POST /api/copilot — the grounded, streaming CoachScore Copilot.
 * P0: rate-limited, token-capped, plain-text streaming, graceful 503/429.
 * P1: real tool-calling (TOOL_DEFS + a bounded execution loop) so answers come
 * from the live scoring/war/guide engines, not invention.
 * Safety: PII redaction + prompt-injection wrapping on user turns.
 * Analytics: tool usage/errors, latency, and token cost recorded per request.
 */
export async function POST(req: Request): Promise<Response> {
  const limit = checkRateLimit(clientKey(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: 'rate_limited', message: 'Slow down a moment.' } },
      {
        status: 429,
        headers: {
          'retry-after': String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      },
    );
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: 'copilot_not_configured',
          message: 'The Copilot is not available right now.',
        },
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'bad_request', message: 'Invalid JSON.' } },
      { status: 400 },
    );
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'validation_error', message: 'Invalid messages.' } },
      { status: 422 },
    );
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY as string,
  });
  const system = buildCopilotSystemPrompt();
  const initial = prepareMessages(parsed.data.messages);

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let convo: Anthropic.MessageParam[] = initial;
      try {
        for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
          const startedAt = Date.now();
          const stream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: COPILOT_LIMITS.maxTokensPerTurn,
            system,
            tools: TOOL_DEFS,
            messages: convo,
          });
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          recordLatency(Date.now() - startedAt);
          recordTokenCost(final.usage.input_tokens + final.usage.output_tokens);

          if (final.stop_reason !== 'tool_use') break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type !== 'tool_use') continue;
            recordToolInvocation(block.name);
            const result = runTool(block.name, block.input);
            if (
              result &&
              typeof result === 'object' &&
              'error' in (result as Record<string, unknown>)
            ) {
              recordToolError(block.name);
            }
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result).slice(0, 4000),
            });
          }
          convo = [
            ...convo,
            { role: 'assistant', content: final.content },
            { role: 'user', content: toolResults },
          ];
        }
      } catch {
        controller.enqueue(
          encoder.encode('\n\n(Sorry — the Copilot hit an error. Try again.)'),
        );
      } finally {
        // Compact observability line; swap the in-memory store for PostHog/Redis
        // at activation for cross-instance aggregation.
        const snap = snapshot();
        console.warn('[copilot]', JSON.stringify(snap));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
