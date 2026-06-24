import { describe, expect, it } from 'vitest';
import {
  ANONYMOUS_IDENTITY,
  assertRole,
  hasAll,
  isElevated,
  resolveIdentity,
  RoleRequiredError,
} from '@/lib/auth';
import type { Identity } from '@/lib/auth';

describe('central identity resolution (Phase 9)', () => {
  it('resolves the anonymous identity until Supabase Auth is wired', () => {
    expect(resolveIdentity()).toEqual(ANONYMOUS_IDENTITY);
    expect(resolveIdentity().userId).toBeNull();
  });

  it('isElevated is true only for coach/admin', () => {
    expect(isElevated({ userId: 'a', role: 'admin' })).toBe(true);
    expect(isElevated({ userId: 'c', role: 'coach' })).toBe(true);
    expect(isElevated({ userId: 'u', role: 'user' })).toBe(false);
    expect(isElevated(ANONYMOUS_IDENTITY)).toBe(false);
  });

  it('assertRole enforces an exact role', () => {
    const admin: Identity = { userId: 'a', role: 'admin' };
    expect(() => assertRole(admin, 'admin')).not.toThrow();
    expect(() => assertRole(admin, 'user')).toThrow(RoleRequiredError);
  });

  it('hasAll checks every required permission', () => {
    const user: Identity = { userId: 'u', role: 'user' };
    expect(hasAll(user, ['report:create', 'product:create'])).toBe(true);
    expect(hasAll(user, ['admin:manage'])).toBe(false);
  });
});
