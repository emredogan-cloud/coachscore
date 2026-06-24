import { describe, expect, it } from 'vitest';
import {
  backoffDelay,
  CachingProvider,
  DEFAULT_RETRY,
  MemoryResponseCache,
  responseCacheKey,
  ResilientProvider,
  TimeoutError,
  withRetry,
  withTimeout,
} from '@/lib/ai';
import type { AiProvider, GenerateOptions, ProviderResponse } from '@/lib/ai';

const baseOptions: GenerateOptions = {
  model: 'claude-opus-4-8',
  system: 'sys',
  messages: [{ role: 'user', content: 'hi' }],
  maxTokens: 100,
};

function fakeResponse(text: string): ProviderResponse {
  return {
    text,
    toolInput: null,
    stopReason: 'end_turn',
    usage: { inputTokens: 10, outputTokens: 5 },
  };
}

function countingProvider(text = 'ok'): AiProvider & { calls: number } {
  return {
    calls: 0,
    async generate() {
      this.calls += 1;
      return fakeResponse(text);
    },
  };
}

describe('response cache', () => {
  it('keys identical requests the same and different requests differently', () => {
    expect(responseCacheKey(baseOptions)).toBe(responseCacheKey(baseOptions));
    expect(responseCacheKey({ ...baseOptions, model: 'x' })).not.toBe(
      responseCacheKey(baseOptions),
    );
  });

  it('serves a hit without calling the inner provider (zero cost)', async () => {
    const inner = countingProvider();
    const cache = new MemoryResponseCache();
    const provider = new CachingProvider(inner, cache);

    const first = await provider.generate(baseOptions);
    expect(first.cached).toBeUndefined();
    expect(inner.calls).toBe(1);

    const second = await provider.generate(baseOptions);
    expect(second.cached).toBe(true);
    expect(second.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
    expect(inner.calls).toBe(1); // not called again

    cache.clear();
    await provider.generate(baseOptions);
    expect(inner.calls).toBe(2); // invalidated → re-fetched
  });
});

describe('resilience', () => {
  it('backoffDelay grows exponentially and caps', () => {
    expect(backoffDelay(1, DEFAULT_RETRY)).toBe(200);
    expect(backoffDelay(2, DEFAULT_RETRY)).toBe(400);
    expect(backoffDelay(99, DEFAULT_RETRY)).toBe(DEFAULT_RETRY.maxDelayMs);
  });

  it('withRetry retries transient failures then succeeds', async () => {
    let n = 0;
    const result = await withRetry(
      async () => {
        n += 1;
        if (n < 3) throw new Error('transient');
        return 'done';
      },
      { sleep: async () => {}, baseDelayMs: 1 },
    );
    expect(result).toBe('done');
    expect(n).toBe(3);
  });

  it('withRetry stops immediately when not retryable', async () => {
    let n = 0;
    await expect(
      withRetry(
        async () => {
          n += 1;
          throw new Error('fatal');
        },
        { sleep: async () => {}, isRetryable: () => false },
      ),
    ).rejects.toThrow('fatal');
    expect(n).toBe(1);
  });

  it('withTimeout rejects a slow promise and passes a fast one', async () => {
    await expect(
      withTimeout(new Promise((r) => setTimeout(r, 50)), 5),
    ).rejects.toBeInstanceOf(TimeoutError);
    await expect(withTimeout(Promise.resolve('fast'), 50)).resolves.toBe(
      'fast',
    );
  });

  it('ResilientProvider retries a flaky provider with no-op sleep', async () => {
    let n = 0;
    const flaky: AiProvider = {
      async generate() {
        n += 1;
        if (n < 2) throw new Error('blip');
        return fakeResponse('recovered');
      },
    };
    const provider = new ResilientProvider(flaky, {
      retry: { sleep: async () => {}, baseDelayMs: 1 },
    });
    const res = await provider.generate(baseOptions);
    expect(res.text).toBe('recovered');
    expect(n).toBe(2);
  });
});
