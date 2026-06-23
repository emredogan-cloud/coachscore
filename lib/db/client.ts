/**
 * Lazy Drizzle client (Phase 3) — the database I/O boundary.
 *
 * The postgres-js connection is created on first use, so the app builds and
 * imports without `DATABASE_URL`; a missing URL fails loudly only when the DB is
 * actually queried. Not exercised by unit tests (the in-memory repositories are);
 * activates when Supabase Postgres is provisioned.
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { requireEnv } from '@/lib/env';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

let cached: Database | null = null;

export function getDb(): Database {
  if (cached === null) {
    const client = postgres(requireEnv('DATABASE_URL'), { prepare: false });
    cached = drizzle(client, { schema });
  }
  return cached;
}
