/**
 * Role → permission mapping (Phase 3). Deny-by-default: a role has exactly the
 * permissions listed here and nothing more. Anonymous (teaser) traffic gets no
 * persistence permissions — it can compute a score but not save or read data.
 */

import type { Permission, Role } from './types';

export const ALL_ROLES: readonly Role[] = ['anon', 'user', 'coach', 'admin'];

const USER_PERMISSIONS: readonly Permission[] = [
  'account:create',
  'account:read:own',
  'snapshot:create',
  'report:create',
  'report:read:own',
  'upload:create',
  'product:create',
  'product:read:own',
];

const COACH_PERMISSIONS: readonly Permission[] = [
  ...USER_PERMISSIONS,
  'account:read:any',
  'report:read:any',
  'report:review',
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...COACH_PERMISSIONS,
  'audit:read',
  'admin:manage',
];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  anon: [],
  user: USER_PERMISSIONS,
  coach: COACH_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

export function permissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
