/**
 * Resilience for AI calls (Phase 8): timeout + bounded retry with exponential
 * backoff. `ResilientProvider` decorates any `AiProvider`. Pure orchestration
 * over an injected provider + sleep, so it is unit-tested deterministically
 * (no-op sleep, fake provider). Paid work must not hang or fail on a transient
 * blip.
 */

import type { AiProvider, GenerateOptions, ProviderResponse } from './types';

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms.`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly factor: number;
  readonly maxDelayMs: number;
  readonly sleep: (ms: number) => Promise<void>;
  readonly isRetryable: (err: unknown) => boolean;
}

export const DEFAULT_RETRY: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 200,
  factor: 2,
  maxDelayMs: 5_000,
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  isRetryable: () => true,
};

export function backoffDelay(attempt: number, config: RetryConfig): number {
  return Math.min(
    config.maxDelayMs,
    config.baseDelayMs * config.factor ** (attempt - 1),
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...config };
  let lastError: unknown;
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= cfg.maxAttempts || !cfg.isRetryable(err)) break;
      await cfg.sleep(backoffDelay(attempt, cfg));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export interface ResilienceConfig {
  readonly timeoutMs?: number;
  readonly retry?: Partial<RetryConfig>;
}

export class ResilientProvider implements AiProvider {
  constructor(
    private readonly inner: AiProvider,
    private readonly config: ResilienceConfig = {},
  ) {}

  generate(options: GenerateOptions): Promise<ProviderResponse> {
    const timeoutMs = this.config.timeoutMs ?? 0;
    return withRetry(
      () => withTimeout(this.inner.generate(options), timeoutMs),
      this.config.retry,
    );
  }
}
