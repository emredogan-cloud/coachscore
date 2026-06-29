import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAiConfigured } from '@/lib/activation';
import {
  buildCopilotSystemPrompt,
  checkRateLimit,
  COPILOT_LIMITS,
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

function clientKey(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anon'
  );
}

/**
 * POST /api/copilot — the grounded, streaming CoachScore Copilot (COPILOT-P0).
 * Rate-limited + token-capped (cost control). Streams plain-text deltas from
 * Anthropic. Degrades to a clean 503 when ANTHROPIC_API_KEY is absent and 429
 * when a client exceeds its window — never an unhandled error.
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
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: COPILOT_LIMITS.maxTokensPerTurn,
    system: buildCopilotSystemPrompt(),
    messages: parsed.data.messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode('\n\n(Sorry — the Copilot hit an error. Try again.)'),
        );
      } finally {
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
