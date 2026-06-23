import { describe, expect, it } from 'vitest';
import {
  ALL_ROLES,
  AuthorizationError,
  assertCan,
  can,
  canReadAccount,
  canReadReport,
  isResourceOwner,
  permissionsForRole,
  ROLE_PERMISSIONS,
} from '@/lib/auth';
import type { Identity } from '@/lib/auth';

const anon: Identity = { userId: null, role: 'anon' };
const alice: Identity = { userId: 'alice', role: 'user' };
const bob: Identity = { userId: 'bob', role: 'user' };
const coach: Identity = { userId: 'carol', role: 'coach' };
const admin: Identity = { userId: 'dave', role: 'admin' };

describe('roles', () => {
  it('lists all roles and gives anon no permissions (deny-by-default)', () => {
    expect(ALL_ROLES).toEqual(['anon', 'user', 'coach', 'admin']);
    expect(ROLE_PERMISSIONS.anon).toEqual([]);
  });

  it('escalates permissions user ⊂ coach ⊂ admin', () => {
    const u = new Set(permissionsForRole('user'));
    const c = new Set(permissionsForRole('coach'));
    const a = new Set(permissionsForRole('admin'));
    for (const p of u) expect(c.has(p)).toBe(true);
    for (const p of c) expect(a.has(p)).toBe(true);
    expect(c.has('report:review')).toBe(true);
    expect(u.has('report:review')).toBe(false);
    expect(a.has('admin:manage')).toBe(true);
  });
});

describe('can / assertCan', () => {
  it('denies anonymous everything', () => {
    expect(can(anon, 'account:create')).toBe(false);
    expect(can(anon, 'report:read:own')).toBe(false);
  });

  it('grants users their own scope but not :any', () => {
    expect(can(alice, 'account:create')).toBe(true);
    expect(can(alice, 'account:read:own')).toBe(true);
    expect(can(alice, 'account:read:any')).toBe(false);
    expect(can(alice, 'report:review')).toBe(false);
  });

  it('grants coaches review + any-read', () => {
    expect(can(coach, 'report:review')).toBe(true);
    expect(can(coach, 'report:read:any')).toBe(true);
  });

  it('assertCan throws AuthorizationError when denied', () => {
    expect(() => assertCan(alice, 'admin:manage')).toThrow(AuthorizationError);
    expect(() => assertCan(admin, 'admin:manage')).not.toThrow();
  });
});

describe('ownership-scoped reads', () => {
  const aliceAccount = { ownerUserId: 'alice' };

  it('isResourceOwner requires a logged-in matching owner', () => {
    expect(isResourceOwner(alice, aliceAccount)).toBe(true);
    expect(isResourceOwner(bob, aliceAccount)).toBe(false);
    expect(isResourceOwner(anon, { ownerUserId: null })).toBe(false);
  });

  it('canReadAccount: owner yes, other user no, coach (any) yes', () => {
    expect(canReadAccount(alice, aliceAccount)).toBe(true);
    expect(canReadAccount(bob, aliceAccount)).toBe(false);
    expect(canReadAccount(coach, aliceAccount)).toBe(true);
    expect(canReadAccount(anon, aliceAccount)).toBe(false);
  });

  it('canReadReport: owner yes, other no, coach + admin yes', () => {
    const r = { ownerUserId: 'alice' };
    expect(canReadReport(alice, r)).toBe(true);
    expect(canReadReport(bob, r)).toBe(false);
    expect(canReadReport(coach, r)).toBe(true);
    expect(canReadReport(admin, r)).toBe(true);
  });
});
