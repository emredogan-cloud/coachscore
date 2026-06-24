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

/**
 * Async persistence boundary (Phase 8) — the production-grade store. A
 * Postgres-backed (`jobs` table) or Redis store implements this; the in-memory
 * async store backs tests. `listByStatus` enables dead-letter inspection.
 */
export interface AsyncQueueStore {
  get<O>(key: string): Promise<JobRecord<O> | undefined>;
  set<O>(key: string, record: JobRecord<O>): Promise<void>;
  listByStatus(status: JobStatus): Promise<JobRecord<unknown>[]>;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly factor: number;
  readonly maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 200,
  factor: 2,
  maxDelayMs: 30_000,
};

export interface DurableRunOptions {
  readonly idempotencyKey: string;
  readonly policy?: RetryPolicy;
  /** Injectable backoff (ms → Promise); tests pass a no-op for determinism. */
  readonly sleep?: (ms: number) => Promise<void>;
  readonly onDeadLetter?: (key: string, error: string) => void | Promise<void>;
}

/**
 * Transport abstraction (Phase 8) for off-process queues — the interface a
 * Redis or QStash adapter implements to hand a job to background workers. The
 * inline transport runs the consumer immediately (single-process default).
 */
export interface QueueJobEnvelope {
  readonly key: string;
  readonly kind: string;
  readonly payload: unknown;
}

export interface QueueTransport {
  publish(job: QueueJobEnvelope): Promise<void>;
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
