import type { AiProvider, GenerateOptions, ProviderResponse } from '@/lib/ai';

/** A deterministic fake AI provider that returns a fixed tool input. */
export function fakeProvider(toolInput: unknown): AiProvider {
  return {
    async generate(_options: GenerateOptions): Promise<ProviderResponse> {
      return {
        text: '',
        toolInput,
        stopReason: 'tool_use',
        usage: { inputTokens: 10, outputTokens: 20 },
      };
    },
  };
}
