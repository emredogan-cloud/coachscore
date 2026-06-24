/**
 * Postgres-backed durable queue store (Phase 8) — the persistent job store that
 * replaces the in-memory map for cross-instance durability. Implements the same
 * `AsyncQueueStore` interface against the existing `jobs` table (via the job
 * repository), mapping the queue's `dead-letter` status to the DB enum's
 * `dead_letter`. Real DB I/O, exercised at activation (DATABASE_URL); outside
 * coverage like the other persistence boundaries.
 */

import type { Job, Repositories } from '@/lib/db';
import type { AsyncQueueStore, JobRecord, JobStatus } from './types';

type DbStatus = Job['status'];

function toDbStatus(status: JobStatus): DbStatus {
  return status === 'dead-letter' ? 'dead_letter' : status;
}
function toQueueStatus(status: DbStatus): JobStatus {
  return status === 'dead_letter' ? 'dead-letter' : status;
}

export class DrizzleQueueStore implements AsyncQueueStore {
  constructor(
    private readonly repos: Repositories,
    private readonly kind: 'extraction' | 'report_draft',
  ) {}

  private toRecord<O>(job: Job): JobRecord<O> {
    return {
      idempotencyKey: job.idempotencyKey,
      status: toQueueStatus(job.status),
      attempts: job.attempts,
      result: (job.result as O | null) ?? null,
      error: job.error,
    };
  }

  async get<O>(key: string): Promise<JobRecord<O> | undefined> {
    const job = await this.repos.jobs.findByIdempotencyKey(key);
    return job ? this.toRecord<O>(job) : undefined;
  }

  async set<O>(key: string, record: JobRecord<O>): Promise<void> {
    const status = toDbStatus(record.status);
    const existing = await this.repos.jobs.findByIdempotencyKey(key);
    if (existing) {
      await this.repos.jobs.update(existing.id, {
        status,
        attempts: record.attempts,
        result: record.result,
        error: record.error,
      });
    } else {
      await this.repos.jobs.create({
        kind: this.kind,
        idempotencyKey: key,
        status,
        attempts: record.attempts,
        // The durable runner tracks status/result/attempts by key; the original
        // input lives with the caller, so the row's payload column is unused here.
        payload: {},
        result: record.result,
        error: record.error,
      });
    }
  }

  async listByStatus(status: JobStatus): Promise<JobRecord<unknown>[]> {
    const rows = await this.repos.jobs.listByStatus(toDbStatus(status));
    return rows.map((job) => this.toRecord(job));
  }
}
