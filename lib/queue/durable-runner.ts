/**
 * Durable job runner (Phase 8) — the async-store counterpart of `runJob`.
 * Idempotent execution, bounded retries with exponential backoff (capped), and
 * dead-lettering, over an injected `AsyncQueueStore` so it runs unchanged
 * against Postgres/Redis at activation. Pure orchestration; unit-tested with the
 * memory async store + no-op sleep.
 */

import { MemoryAsyncQueueStore } from './async-store';
import {
  DEFAULT_RETRY_POLICY,
  type AsyncQueueStore,
  type DurableRunOptions,
  type JobOutcome,
  type JobRecord,
  type RetryPolicy,
} from './types';

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function queueBackoff(attempt: number, policy: RetryPolicy): number {
  return Math.min(
    policy.maxDelayMs,
    policy.baseDelayMs * policy.factor ** (attempt - 1),
  );
}

export async function runDurableJob<I, O>(
  handler: (input: I) => Promise<O>,
  input: I,
  options: DurableRunOptions,
  store: AsyncQueueStore = new MemoryAsyncQueueStore(),
): Promise<JobOutcome<O>> {
  const policy = options.policy ?? DEFAULT_RETRY_POLICY;
  const sleep = options.sleep ?? defaultSleep;
  const key = options.idempotencyKey;

  const existing = await store.get<O>(key);
  if (existing && existing.status === 'completed') {
    return {
      status: 'completed',
      result: existing.result,
      attempts: existing.attempts,
      error: null,
      deduplicated: true,
    };
  }

  const record: JobRecord<O> = existing ?? {
    idempotencyKey: key,
    status: 'pending',
    attempts: 0,
    result: null,
    error: null,
  };

  let lastError = '';
  while (record.attempts < policy.maxAttempts) {
    record.attempts += 1;
    record.status = 'running';
    await store.set<O>(key, record);
    try {
      const result = await handler(input);
      record.status = 'completed';
      record.result = result;
      record.error = null;
      await store.set<O>(key, record);
      return {
        status: 'completed',
        result,
        attempts: record.attempts,
        error: null,
        deduplicated: false,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      record.status = 'failed';
      record.error = lastError;
      await store.set<O>(key, record);
      if (record.attempts < policy.maxAttempts) {
        await sleep(queueBackoff(record.attempts, policy));
      }
    }
  }

  record.status = 'dead-letter';
  await store.set<O>(key, record);
  await options.onDeadLetter?.(key, lastError);
  return {
    status: 'dead-letter',
    result: null,
    attempts: record.attempts,
    error: lastError,
    deduplicated: false,
  };
}
