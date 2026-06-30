import { describe, expect, it } from 'vitest';
import { parentPath } from '@/components/ui/back-button';

describe('BackButton parentPath (cold-load fallback)', () => {
  it('drops the last segment of a nested route', () => {
    expect(parentPath('/guides/th16-upgrade-order')).toBe('/guides');
    expect(parentPath('/products/replay-doctor')).toBe('/products');
    expect(parentPath('/admin/growth')).toBe('/admin');
  });

  it('returns home for a top-level route', () => {
    expect(parentPath('/methodology')).toBe('/');
    expect(parentPath('/report')).toBe('/');
    expect(parentPath('/pricing')).toBe('/');
  });

  it('returns home for the root and empty paths', () => {
    expect(parentPath('/')).toBe('/');
    expect(parentPath('')).toBe('/');
  });

  it('handles trailing slashes without producing an empty segment', () => {
    expect(parentPath('/guides/th16/')).toBe('/guides');
    expect(parentPath('/guides/')).toBe('/');
  });

  it('handles deeper nesting', () => {
    expect(parentPath('/settings/notifications')).toBe('/settings');
    expect(parentPath('/coach/dashboard')).toBe('/coach');
  });
});
