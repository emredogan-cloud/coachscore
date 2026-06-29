/**
 * Player archetype + prestige (EMO-P2 — identity systems).
 *
 * Turns a grade + goal into a shareable identity ("Legendary War Machine") — the
 * deepest retention/virality driver in CoC is identity, not a bare number. Pure
 * + deterministic so it's testable and SSR-safe. No game-data fabrication: this
 * is a label derived from the player's own goal + grade, not a claim about the
 * game.
 */

export interface Archetype {
  readonly name: string;
  readonly tagline: string;
}

const BY_GOAL: Readonly<Record<string, Archetype>> = {
  war: { name: 'War Machine', tagline: 'Built to three-star.' },
  trophy: { name: 'Trophy Hunter', tagline: 'Climbing the leagues.' },
  derush: { name: 'Rebuilder', tagline: 'Catching up, fast.' },
  recruit: { name: 'The Recruit', tagline: 'Ready for a top clan.' },
  progress: { name: 'Steady Hand', tagline: 'Maxing the right way.' },
  rate: { name: 'All-Rounder', tagline: 'A balanced base.' },
};

/** A prestige prefix by grade tier — the "level up your identity" hook. */
function prestige(grade: string): string {
  if (grade === 'S') return 'Legendary ';
  if (grade === 'A') return 'Elite ';
  if (grade === 'D' || grade === 'F') return 'Aspiring ';
  return '';
}

/** Derive a shareable archetype from the player's goal + grade. Pure. */
export function deriveArchetype(goal: string, grade: string): Archetype {
  const base = BY_GOAL[goal] ?? BY_GOAL.rate!;
  return { name: `${prestige(grade)}${base.name}`, tagline: base.tagline };
}
