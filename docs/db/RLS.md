# Row-Level Security (Phase 3)

Deny-by-default RLS lives in `lib/db/migrations/0001_rls_policies.sql` and is
applied automatically with the rest of the migrations at activation
(`pnpm exec drizzle-kit migrate`, once `DATABASE_URL` points at Supabase).

## Model

The SQL mirrors `lib/auth/policy.ts`, so the same rules are enforced in the app
layer **and** at the database (defense in depth):

| Table | authenticated user | coach / admin | server (`service_role`) |
|-------|--------------------|---------------|--------------------------|
| `users` | read/update own row | read all | full (bypasses RLS) |
| `accounts` | full CRUD on own | read all | full |
| `account_snapshots` | read/insert via owned account; **immutable** (no update/delete) | read all | full |
| `reports` | read/create own (via account) | read all + update (review/deliver) | full |
| `report_drafts` | read own (report→account) | read all | full (only writer) |
| `uploads` | CRUD own by `user_id` | read all | full |
| `jobs` | **denied** | **denied** | full (FORCE RLS) |
| `audit_logs` | **denied** | **denied** | full (FORCE RLS) |

## Notes

- Targets **Supabase**: `auth.uid()` returns the authenticated user's UUID, and
  the `service_role` key (used only server-side) bypasses RLS for trusted writes
  performed by `lib/db/repositories/drizzle.ts`.
- Enabling RLS with no matching policy **denies** access — that is the default
  posture; every grant above is explicit.
- `account_snapshots` has no UPDATE/DELETE policy, enforcing snapshot
  immutability at the database, matching `lib/snapshot` (version-locked, hashed).
- `jobs` and `audit_logs` use `FORCE ROW LEVEL SECURITY` so even the table owner
  is subject to RLS; they are reachable only via the service role.

## Activation checklist

1. Provision Supabase; set `DATABASE_URL` (+ `NEXT_PUBLIC_SUPABASE_URL`,
   anon + `SUPABASE_SERVICE_ROLE_KEY`).
2. `pnpm exec drizzle-kit migrate` (applies `0000_*` schema then `0001_*` RLS).
3. Verify with cross-tenant read tests (a user must not read another user's
   accounts/reports) before enabling any paid flow.
