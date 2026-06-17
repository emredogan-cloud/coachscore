/**
 * Job runner: idempotent execution with bounded retries, exponential backoff,
 * and dead-lettering. Pure orchestration over an injected store + handler, so
 * it is fully unit-testable (inject a no-op sleep for determinism).
 */

import { InMemoryQueueStore } from './memory-store';
import {
  DEFAULT_MAX_ATTEMPTS,
  type JobOutcome,
  type QueueStore,
  type RunOptions,
} from './types';

const defaultStore = new InMemoryQueueStore();
const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `handler(input)` durably under an idempotency key.
 *
 * - If a completed record already exists for the key, returns it without
 *   re-running (idempotency).
 * - On failure, retries up to `maxAttempts` with exponential backoff.
 * - After exhausting attempts, marks the job dead-letter and invokes the hook.
 */
export async function runJob<I, O>(
  handler: (input: I) => Promise<O>,
  input: I,
  options: RunOptions,
  store: QueueStore = defaultStore,
): Promise<JobOutcome<O>> {
  const {
    idempotencyKey,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    sleep = defaultSleep,
    baseDelayMs = 200,
    onDeadLetter,
  } = options;

  const existing = store.get<O>(idempotencyKey);
  if (existing && existing.status === 'completed') {
    return {
      status: 'completed',
      result: existing.result,
      attempts: existing.attempts,
      error: null,
      deduplicated: true,
    };
  }

  const record = existing ?? {
    idempotencyKey,
    status: 'pending' as const,
    attempts: 0,
    result: null as O | null,
    error: null as string | null,
  };

  let lastError = '';
  while (record.attempts < maxAttempts) {
    record.attempts += 1;
    record.status = 'running';
    store.set<O>(idempotencyKey, record);
    try {
      const result = await handler(input);
      record.status = 'completed';
      record.result = result;
      record.error = null;
      store.set<O>(idempotencyKey, record);
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
      store.set<O>(idempotencyKey, record);
      if (record.attempts < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (record.attempts - 1));
      }
    }
  }

  record.status = 'dead-letter';
  store.set<O>(idempotencyKey, record);
  onDeadLetter?.(idempotencyKey, lastError);
  return {
    status: 'dead-letter',
    result: null,
    attempts: record.attempts,
    error: lastError,
    deduplicated: false,
  };
}
