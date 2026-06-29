import { describe, expect, it } from 'vitest';
import { benchmarkVsMaxed } from '@/lib/benchmark';
import type { SubScores } from '@/lib/core';

const subs = (over: Partial<SubScores>): SubScores => ({
  heroes: 80,
  offense: 70,
  defense: 60,
  equipment: 50,
  progression: 90,
  walls: 75,
  clanValue: 65,
  ...over,
});

describe('benchmarkVsMaxed', () => {
  it('frames the score as % of a maxed base for the TH', () => {
    const b = benchmarkVsMaxed(subs({}), 72, 16);
    expect(b.headline).toBe("You're 72% of a maxed TH16 base.");
    expect(b.overallGap).toBe(28);
  });

  it('finds the biggest gap to max', () => {
    const b = benchmarkVsMaxed(subs({ equipment: 30 }), 70, 16);
    expect(b.biggest?.key).toBe('equipment');
    expect(b.biggest?.gap).toBe(70);
  });

  it('excludes unobservable (null) dimensions (tag-path defense/walls)', () => {
    const b = benchmarkVsMaxed(subs({ defense: null, walls: null }), 70, 17);
    expect(b.gaps.some((g) => g.key === 'defense')).toBe(false);
    expect(b.gaps.some((g) => g.key === 'walls')).toBe(false);
  });
});
