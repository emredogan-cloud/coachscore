/**
 * Intake persistence wiring (Phase 3) — the DB activation boundary.
 *
 * Resolves the real (Drizzle/Postgres) repositories and saves an intake via the
 * persistence service. Identity resolution is stubbed to anonymous until
 * Supabase Auth is wired, so until then this reports `authentication_required`
 * even when the database is configured. Exercised at activation, not in unit
 * tests (the handler tests inject a fake `persist`).
 */

import { createDrizzleRepositories, PersistenceService } from '@/lib/db';
import { resolveIdentity } from '@/lib/auth';
import type { IntakeResult } from '@/lib/intake';

export interface PersistenceInfo {
  readonly attempted: boolean;
  readonly persisted: boolean;
  readonly reason?: string;
  readonly accountId?: string;
  readonly snapshotId?: string;
}

export async function persistIntake(
  result: IntakeResult,
): Promise<PersistenceInfo> {
  const identity = resolveIdentity();
  if (identity.userId === null) {
    return {
      attempted: true,
      persisted: false,
      reason: 'authentication_required',
    };
  }
  const service = new PersistenceService(createDrizzleRepositories());
  const saved = await service.saveIntake({ identity, intake: result });
  return {
    attempted: true,
    persisted: true,
    accountId: saved.account.id,
    snapshotId: saved.snapshot.id,
  };
}
