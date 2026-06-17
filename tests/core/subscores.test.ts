import { describe, expect, it } from 'vitest';
import {
  clamp,
  clanValueScore,
  completion,
  equipmentScore,
  heroScore,
  progressionScore,
  rushLabel,
  wallScore,
  weightedCompletionScore,
} from '@/lib/core';
import type { HeroInput } from '@/lib/core';

describe('completion / clamp', () => {
  it('computes a clamped completion ratio', () => {
    expect(completion(50, 100)).toBe(0.5);
    expect(completion(100, 100)).toBe(1);
    expect(completion(150, 100)).toBe(1); // clamped
    expect(completion(5, 0)).toBe(0); // guard: maxLevel 0
  });

  it('clamps into range', () => {
    expect(clamp(-10)).toBe(0);
    expect(clamp(110)).toBe(100);
    expect(clamp(42)).toBe(42);
  });
});

describe('heroScore — DE-cost-weighted (deep-dive §7.2(1))', () => {
  it('reproduces the TH13 worked example (≈ 76)', () => {
    // BK 65/75, AQ 70/75, GW 40/55, RC 15/25; weights 1.0/1.0/1.3/1.4.
    const heroes: HeroInput[] = [
      { id: 'barbarianKing', level: 65, maxLevel: 75, deCostWeight: 1.0 },
      { id: 'archerQueen', level: 70, maxLevel: 75, deCostWeight: 1.0 },
      { id: 'grandWarden', level: 40, maxLevel: 55, deCostWeight: 1.3 },
      { id: 'royalChampion', level: 15, maxLevel: 25, deCostWeight: 1.4 },
    ];
    expect(Math.round(heroScore(heroes))).toBe(76);
  });

  it('excludes not-unlocked heroes (maxLevel 0) and guards empty input', () => {
    expect(heroScore([])).toBe(0);
    const partial: HeroInput[] = [
      { id: 'barbarianKing', level: 50, maxLevel: 50, deCostWeight: 1 },
      { id: 'royalChampion', level: 0, maxLevel: 0, deCostWeight: 0 },
    ];
    expect(heroScore(partial)).toBe(100); // only the maxed BK counts
  });
});

describe('weightedCompletionScore (offense / defense / progression)', () => {
  it('weights elements by cost/time', () => {
    const score = weightedCompletionScore([
      { id: 'a', level: 10, maxLevel: 10, weight: 3 }, // 1.0
      { id: 'b', level: 0, maxLevel: 10, weight: 1 }, // 0.0
    ]);
    // (3*1 + 1*0) / 4 = 0.75 → 75
    expect(score).toBe(75);
  });

  it('returns 0 for empty / zero-weight input', () => {
    expect(weightedCompletionScore([])).toBe(0);
    expect(
      weightedCompletionScore([{ id: 'x', level: 5, maxLevel: 10, weight: 0 }]),
    ).toBe(0);
  });

  it('progressionScore delegates to weighted completion', () => {
    expect(
      progressionScore([{ id: 'p', level: 93, maxLevel: 100, weight: 1 }]),
    ).toBe(93);
  });
});

describe('equipmentScore — N/A below TH16 (deep-dive §7.2(4))', () => {
  it('returns null when unavailable', () => {
    expect(
      equipmentScore({
        available: false,
        keyEpicsUnlocked: 0,
        keyEpicsTotal: 0,
        levelSum: 0,
        maxLevelSum: 0,
      }),
    ).toBeNull();
  });

  it('blends epics-unlocked and level ratios 50/50', () => {
    // epics 3/6 = 0.5, levels 30/60 = 0.5 → 100*(0.25+0.25) = 50
    expect(
      equipmentScore({
        available: true,
        keyEpicsUnlocked: 3,
        keyEpicsTotal: 6,
        levelSum: 30,
        maxLevelSum: 60,
      }),
    ).toBe(50);
  });

  it('guards zero denominators', () => {
    expect(
      equipmentScore({
        available: true,
        keyEpicsUnlocked: 0,
        keyEpicsTotal: 0,
        levelSum: 0,
        maxLevelSum: 0,
      }),
    ).toBe(0);
  });
});

describe('wallScore (deep-dive §7.2(6))', () => {
  it('is the fraction at/above the TH max', () => {
    expect(wallScore({ atOrAboveThMax: 85, total: 100 })).toBe(85);
    expect(wallScore({ atOrAboveThMax: 0, total: 0 })).toBe(0); // guard
  });
});

describe('clanValueScore (deep-dive §7.2(7))', () => {
  it('weights donation .30 / war .30 / capital .20 / activity .20', () => {
    expect(
      clanValueScore({
        donationBehavior: 0.78,
        warContribution: 0.78,
        capitalContribution: 0.78,
        activitySignal: 0.78,
      }),
    ).toBeCloseTo(78, 6);
    expect(
      clanValueScore({
        donationBehavior: 1,
        warContribution: 0,
        capitalContribution: 0,
        activitySignal: 0,
      }),
    ).toBe(30);
  });
});

describe('rushLabel (deep-dive §7.2(5))', () => {
  it('maps progression score to the categorical label', () => {
    expect(rushLabel(95)).toBe('Well-Developed');
    expect(rushLabel(94)).toBe('Lightly Rushed');
    expect(rushLabel(80)).toBe('Lightly Rushed');
    expect(rushLabel(79)).toBe('Moderately Rushed');
    expect(rushLabel(60)).toBe('Moderately Rushed');
    expect(rushLabel(59)).toBe('Heavily Rushed');
    expect(rushLabel(0)).toBe('Heavily Rushed');
  });
});
