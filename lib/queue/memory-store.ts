/**
 * In-memory QueueStore. Sufficient for single-process dev and tests; replaced
 * by a Redis/Postgres-backed store implementing the same interface for
 * production durability across instances.
 */

import type { JobRecord, QueueStore } from './types';

export class InMemoryQueueStore implements QueueStore {
  private readonly records = new Map<string, JobRecord<unknown>>();

  get<O>(key: string): JobRecord<O> | undefined {
    return this.records.get(key) as JobRecord<O> | undefined;
  }

  set<O>(key: string, record: JobRecord<O>): void {
    this.records.set(key, record as JobRecord<unknown>);
  }

  /** Test/diagnostic helper. */
  size(): number {
    return this.records.size;
  }
}
