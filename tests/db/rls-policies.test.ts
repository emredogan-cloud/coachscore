import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Static RLS regression guard (Phase 9). Reads the migration SQL and asserts
 * every table that holds user/operational data has Row-Level Security ENABLED.
 * This catches the classic mistake — adding a table without RLS — without a live
 * database. The cross-tenant *enforcement* test (RLS actually denies) is the
 * gated live integration suite (`tests/integration/rls.test.ts`).
 */

const MIGRATIONS_DIR = join(process.cwd(), 'lib', 'db', 'migrations');

const REQUIRES_RLS = [
  'users',
  'accounts',
  'account_snapshots',
  'reports',
  'uploads',
  'orders',
  'entitlements',
  'coaches',
  'review_assignments',
  'payouts',
  'product_submissions',
  'product_reports',
  'analytics_events',
  'experiment_assignments',
  'referral_codes',
  'referrals',
  'lifecycle_messages',
];

function allMigrationSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'))
    .join('\n');
}

describe('Row-Level Security coverage', () => {
  const sql = allMigrationSql();

  it.each(REQUIRES_RLS)('enables RLS on %s', (table) => {
    expect(sql).toContain(`"${table}" ENABLE ROW LEVEL SECURITY`);
  });

  it('defines deny-by-default policies referencing auth.uid()', () => {
    expect(sql).toContain('auth.uid()');
    expect(sql).toContain('current_user_has_elevated_role()');
  });
});
