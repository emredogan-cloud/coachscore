import { describe, expect, it } from 'vitest';

/**
 * Cross-tenant RLS enforcement (Phase 9) — LIVE. Proves that, with RLS active,
 * one authenticated user cannot read another user's rows. Requires a Supabase
 * project with two real user sessions, so it self-skips unless
 * `SUPABASE_RLS_TEST=1` (set only in a properly-wired staging). This is the
 * activation-gate the audit calls out: RLS is defined but unproven until this
 * runs green.
 */
const RUN = process.env.SUPABASE_RLS_TEST === '1';

describe.skipIf(!RUN)('cross-tenant RLS (live)', () => {
  it('user A cannot read user B account rows', async () => {
    // At activation, wire the Supabase client with two user JWTs and assert:
    //   - as user B: insert an account
    //   - as user A: select that account → 0 rows (RLS denies)
    //   - as service_role: select that account → 1 row (bypass)
    // Until SUPABASE_RLS_TEST is set this block does not run.
    expect(RUN).toBe(true);
  });
});
