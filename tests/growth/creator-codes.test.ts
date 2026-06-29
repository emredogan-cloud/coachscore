import { describe, expect, it } from 'vitest';
import {
  CREATOR_CODES,
  isCreatorCodeFormat,
  normalizeCreatorCode,
  resolveCreatorCode,
  type CreatorCode,
} from '@/lib/growth';

describe('creator codes (growth foundation)', () => {
  it('normalizes to uppercase', () => {
    expect(normalizeCreatorCode(' judosloth ')).toBe('JUDOSLOTH');
  });

  it('validates vanity-code format', () => {
    expect(isCreatorCodeFormat('JUDO')).toBe(true);
    expect(isCreatorCodeFormat('a')).toBe(false); // too short
    expect(isCreatorCodeFormat('bad code!')).toBe(false);
  });

  it('resolves a registered code (registry injectable)', () => {
    const registry: CreatorCode[] = [{ code: 'JUDO', handle: '@judo' }];
    expect(resolveCreatorCode('judo', registry)?.handle).toBe('@judo');
    expect(resolveCreatorCode('nope', registry)).toBeNull();
  });

  it('ships an empty seed registry (no fake creators)', () => {
    expect(CREATOR_CODES).toEqual([]);
    expect(resolveCreatorCode('anything')).toBeNull();
  });
});
