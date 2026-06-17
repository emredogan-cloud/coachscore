/**
 * Durable job-queue abstraction for the AI pipeline.
 *
 * The orchestration semantics that matter — idempotency, bounded retries with
 * backoff, and dead-lettering — are implemented here against a pluggable
 * `QueueStore`. The in-memory store ships now; a Redis/Postgres-backed store
 * implements the same interface for production durability (Phase 3+). This is
 * the transport-agnostic core, not a mock.
 */

export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'dead-letter';

export interface JobRecord<O> {
  readonly idempotencyKey: string;
  status: JobStatus;
  attempts: number;
  result: O | null;
  error: string | null;
}

/** Persistence boundary. Swap the in-memory impl for Redis/Postgres later. */
export interface QueueStore {
  get<O>(key: string): JobRecord<O> | undefined;
  set<O>(key: string, record: JobRecord<O>): void;
}

export interface RunOptions {
  readonly idempotencyKey: string;
  readonly maxAttempts?: number;
  /** Injectable backoff (ms → Promise); tests pass a no-op for determinism. */
  readonly sleep?: (ms: number) => Promise<void>;
  /** Base backoff in ms (exponential per attempt). */
  readonly baseDelayMs?: number;
  readonly onDeadLetter?: (key: string, error: string) => void;
}

export interface JobOutcome<O> {
  readonly status: 'completed' | 'dead-letter';
  readonly result: O | null;
  readonly attempts: number;
  readonly error: string | null;
  /** True when a prior completed record was returned without re-running. */
  readonly deduplicated: boolean;
}

export const DEFAULT_MAX_ATTEMPTS = 3;
