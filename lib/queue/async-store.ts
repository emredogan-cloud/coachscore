/**
 * In-memory async QueueStore (Phase 8). Implements the production async
 * interface for single-process dev + tests; the Drizzle/Postgres store
 * (`drizzle-store.ts`) implements the same interface for cross-instance
 * durability at activation.
 */

import type { AsyncQueueStore, JobRecord, JobStatus } from './types';

export class MemoryAsyncQueueStore implements AsyncQueueStore {
  private readonly records = new Map<string, JobRecord<unknown>>();

  async get<O>(key: string): Promise<JobRecord<O> | undefined> {
    return this.records.get(key) as JobRecord<O> | undefined;
  }

  async set<O>(key: string, record: JobRecord<O>): Promise<void> {
    this.records.set(key, record as JobRecord<unknown>);
  }

  async listByStatus(status: JobStatus): Promise<JobRecord<unknown>[]> {
    return [...this.records.values()].filter((r) => r.status === status);
  }

  get size(): number {
    return this.records.size;
  }
}
