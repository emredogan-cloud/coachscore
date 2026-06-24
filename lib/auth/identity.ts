/**
 * Central request-identity resolution (Phase 9).
 *
 * Single source of truth for "who is acting". Until Supabase Auth is wired,
 * `resolveIdentity` returns the anonymous identity — but every route, server
 * action, and wire helper resolves identity through THIS function, so activation
 * is a one-file change (read the Supabase session here) instead of the four
 * copy-pasted stubs Phase 7's audit flagged.
 */

import { can } from './policy';
import type { Identity, Permission, Role } from './types';

export const ANONYMOUS_IDENTITY: Identity = { userId: null, role: 'anon' };

/**
 * Resolve the current request's identity. Replace the body with Supabase Auth
 * session resolution at activation; callers never change.
 */
export function resolveIdentity(): Identity {
  return ANONYMOUS_IDENTITY;
}

/** True for coach/admin roles — the elevated (staff) tier. */
export function isElevated(identity: Identity): boolean {
  return identity.role === 'admin' || identity.role === 'coach';
}

export class RoleRequiredError extends Error {
  constructor(required: Role) {
    super(`Requires the "${required}" role.`);
    this.name = 'RoleRequiredError';
  }
}

/** Enforce an exact role (e.g. admin-only ops surfaces). Deny-by-default. */
export function assertRole(identity: Identity, role: Role): void {
  if (identity.role !== role) throw new RoleRequiredError(role);
}

/** Convenience: does the identity hold every listed permission? */
export function hasAll(
  identity: Identity,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((p) => can(identity, p));
}
