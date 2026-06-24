/**
 * Auth + authorization types (Phase 3).
 *
 * Roles and a permission model are defined in code; deny-by-default checks live
 * in `policy.ts`. These mirror the database Row-Level Security policies (see
 * lib/db/migrations/*_rls_policies.sql) so the same rules are enforced both in
 * the app layer and at the database, once Supabase Auth + Postgres are activated.
 */

export type Role = 'anon' | 'user' | 'coach' | 'admin';

export type Permission =
  | 'account:create'
  | 'account:read:own'
  | 'account:read:any'
  | 'snapshot:create'
  | 'report:create'
  | 'report:read:own'
  | 'report:read:any'
  | 'report:review'
  | 'upload:create'
  | 'product:create'
  | 'product:read:own'
  | 'referral:create'
  | 'referral:read:own'
  | 'audit:read'
  | 'admin:manage';

/** Who is acting. `userId` is null for anonymous (teaser) traffic. */
export interface Identity {
  readonly userId: string | null;
  readonly role: Role;
}

/** A resource that has an owner, for ownership-scoped checks. */
export interface OwnedResource {
  readonly ownerUserId: string | null;
}
