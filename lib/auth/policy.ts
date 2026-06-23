/**
 * Deny-by-default authorization checks (Phase 3). Pure functions over an
 * `Identity` and (where ownership matters) an `OwnedResource`. The same logic
 * is mirrored by Postgres RLS at activation, so a missing app-layer check is
 * still caught at the database.
 */

import { permissionsForRole } from './roles';
import type { Identity, OwnedResource, Permission } from './types';

export class AuthorizationError extends Error {
  constructor(permission: Permission) {
    super(`Not authorized: missing permission "${permission}".`);
    this.name = 'AuthorizationError';
  }
}

/** True iff the identity's role grants the permission. Deny-by-default. */
export function can(identity: Identity, permission: Permission): boolean {
  return permissionsForRole(identity.role).includes(permission);
}

export function assertCan(identity: Identity, permission: Permission): void {
  if (!can(identity, permission)) {
    throw new AuthorizationError(permission);
  }
}

/** Ownership: a logged-in identity that owns the resource. */
export function isResourceOwner(
  identity: Identity,
  resource: OwnedResource,
): boolean {
  return identity.userId !== null && identity.userId === resource.ownerUserId;
}

/** Read an account: `:any` holders always; otherwise `:own` + ownership. */
export function canReadAccount(
  identity: Identity,
  resource: OwnedResource,
): boolean {
  if (can(identity, 'account:read:any')) return true;
  return (
    can(identity, 'account:read:own') && isResourceOwner(identity, resource)
  );
}

/** Read a report: `:any` holders (e.g. coaches) always; otherwise owner only. */
export function canReadReport(
  identity: Identity,
  resource: OwnedResource,
): boolean {
  if (can(identity, 'report:read:any')) return true;
  return (
    can(identity, 'report:read:own') && isResourceOwner(identity, resource)
  );
}
