import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA manifest', () => {
  it('is installable as a standalone app with icons', () => {
    const m = manifest();
    expect(m.name).toContain('CoachScore');
    expect(m.short_name).toBe('CoachScore');
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/');
    expect((m.icons ?? []).length).toBeGreaterThanOrEqual(1);
    expect(m.icons?.some((i) => i.purpose === 'maskable')).toBe(true);
  });
});
