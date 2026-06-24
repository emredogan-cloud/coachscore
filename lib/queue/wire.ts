/**
 * Queue store resolution (Phase 8) — the activation boundary. Returns the
 * Postgres-backed durable store when the database is configured, else a
 * process-wide in-memory async store (single-process dev). Feature-gated: no
 * code change is needed to switch to durable persistence — just DATABASE_URL.
 * Exercised at activation; outside coverage.
 */

import { isDatabaseConfigured } from '@/lib/activation';
import { createDrizzleRepositories } from '@/lib/db';
import { MemoryAsyncQueueStore } from './async-store';
import { DrizzleQueueStore } from './drizzle-store';
import type { AsyncQueueStore } from './types';

const processStore = new MemoryAsyncQueueStore();

export function resolveQueueStore(
  kind: 'extraction' | 'report_draft',
): AsyncQueueStore {
  if (isDatabaseConfigured()) {
    return new DrizzleQueueStore(createDrizzleRepositories(), kind);
  }
  return processStore;
}
