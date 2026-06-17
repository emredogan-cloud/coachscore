import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import { TH14_WAR_EXAMPLE, TH16_MAXED } from './fixtures';

describe('computeCoachScore — TH14 war golden example (deep-dive §7.7)', () => {
  const result = computeCoachScore(TH14_WAR_EXAMPLE, 'war');

  it('reproduces the sub-scores from the worked example', () => {
    expect(Math.round(result.subScores.heroes)).toBe(83);
    expect(result.subScores.offense).toBe(85);
    expect(result.subScores.defense).toBe(82);
    expect(result.subScores.progression).toBe(93);
    expect(result.subScores.walls).toBe(85);
    expect(Math.round(result.subScores.clanValue ?? -1)).toBe(78);
    expect(result.subScores.equipment).toBeNull(); // N/A at TH14
  });

  it('reproduces the composite ≈ 85 and Grade A', () => {
    expect(result.overall).toBeCloseTo(84.9, 1);
    expect(result.overallRounded).toBe(85);
    expect(result.grade).toBe('A');
  });

  it('labels the account "Lightly Rushed"', () => {
    expect(result.rushLabel).toBe('Lightly Rushed');
  });

  it('surfaces Royal Champion and Grand Warden as the top hero gaps', () => {
    const heroGaps = result.gaps.filter((g) => g.category === 'heroes');
    expect(heroGaps.length).toBe(4);
    const topTwo = heroGaps.slice(0, 2).map((g) => g.id);
    expect(topTwo).toContain('royalChampion');
    expect(topTwo).toContain('grandWarden');
  });

  it('only includes elements below their target, sorted by priority', () => {
    for (const gap of result.gaps) {
      expect(gap.completion).toBeLessThan(1);
      expect(gap.underCompletion).toBeGreaterThan(0);
    }
    const priorities = result.gaps.map((g) => g.priority);
    const sorted = [...priorities].sort((a, b) => b - a);
    expect(priorities).toEqual(sorted);
  });

  it('stamps the engine version', () => {
    expect(result.engineVersion).toBe('1.0.0');
  });
});

describe('computeCoachScore — maxed TH16 account', () => {
  const result = computeCoachScore(TH16_MAXED, 'progress');

  it('scores 100 / Grade S with no gaps and equipment in play', () => {
    expect(result.overallRounded).toBe(100);
    expect(result.grade).toBe('S');
    expect(result.rushLabel).toBe('Well-Developed');
    expect(result.subScores.equipment).toBe(100);
    expect(result.gaps).toHaveLength(0);
  });
});

describe('computeCoachScore — input validation', () => {
  it('rejects a non-positive or non-integer Town Hall', () => {
    expect(() =>
      computeCoachScore({ ...TH14_WAR_EXAMPLE, townHall: 0 }, 'war'),
    ).toThrow(RangeError);
    expect(() =>
      computeCoachScore({ ...TH14_WAR_EXAMPLE, townHall: 13.5 }, 'war'),
    ).toThrow(RangeError);
  });
});
