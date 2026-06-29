import { describe, expect, it } from 'vitest';
import { deriveArchetype } from '@/lib/identity';

describe('deriveArchetype', () => {
  it('maps goal to an archetype family', () => {
    expect(deriveArchetype('war', 'B').name).toContain('War Machine');
    expect(deriveArchetype('trophy', 'B').name).toContain('Trophy Hunter');
    expect(deriveArchetype('derush', 'B').name).toContain('Rebuilder');
  });

  it('adds a prestige prefix by grade tier', () => {
    expect(deriveArchetype('war', 'S').name).toBe('Legendary War Machine');
    expect(deriveArchetype('war', 'A').name).toBe('Elite War Machine');
    expect(deriveArchetype('war', 'F').name).toBe('Aspiring War Machine');
    expect(deriveArchetype('war', 'B').name).toBe('War Machine');
  });

  it('falls back to All-Rounder for an unknown goal', () => {
    expect(deriveArchetype('mystery', 'B').name).toContain('All-Rounder');
  });
});
