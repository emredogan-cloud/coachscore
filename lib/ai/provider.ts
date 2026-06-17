/**
 * Real Anthropic provider (ADR 0005) — no mocks, no fakes. The client is
 * created lazily at first call so the app builds and runs without a key; a
 * missing key fails loudly only when AI is actually invoked.
 *
 * Structured output is obtained via forced tool use: the model must call the
 * supplied tool, and we return its validated input.
 */

import Anthropic from '@anthropic-ai/sdk';
import { optionalEnv, requireEnv } from '@/lib/env';
import type { AiProvider, GenerateOptions, ProviderResponse } from './types';

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (cachedClient === null) {
    cachedClient = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  }
  return cachedClient;
}

/** Model ids are configurable via env; sensible current defaults otherwise. */
export const MODELS = {
  reasoning: () => optionalEnv('ANTHROPIC_MODEL_REASONING', 'claude-opus-4-8'),
  extraction: () =>
    optionalEnv('ANTHROPIC_MODEL_EXTRACTION', 'claude-haiku-4-5-20251001'),
} as const;

function buildMessages(options: GenerateOptions): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = options.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Attach images (if any) to the first user message as a content array.
  if (options.images && options.images.length > 0) {
    const firstUserIdx = messages.findIndex((m) => m.role === 'user');
    const idx = firstUserIdx === -1 ? 0 : firstUserIdx;
    const base = messages[idx];
    const text = typeof base?.content === 'string' ? base.content : '';
    const blocks: Anthropic.ContentBlockParam[] = [
      { type: 'text', text },
      ...options.images.map(
        (img): Anthropic.ContentBlockParam => ({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: img.dataBase64,
          },
        }),
      ),
    ];
    messages[idx] = { role: 'user', content: blocks };
  }

  return messages;
}

export class AnthropicProvider implements AiProvider {
  async generate(options: GenerateOptions): Promise<ProviderResponse> {
    const client = getClient();

    const response = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      system: options.system,
      messages: buildMessages(options),
      ...(options.tool
        ? {
            tools: [
              {
                name: options.tool.name,
                description: options.tool.description,
                input_schema: options.tool
                  .inputSchema as Anthropic.Tool.InputSchema,
              },
            ],
            tool_choice: { type: 'tool', name: options.tool.name },
          }
        : {}),
    });

    let text = '';
    let toolInput: unknown = null;
    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use') {
        toolInput = block.input;
      }
    }

    return {
      text,
      toolInput,
      stopReason: response.stop_reason ?? 'unknown',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

/** The default production provider. */
export function defaultProvider(): AiProvider {
  return new AnthropicProvider();
}
