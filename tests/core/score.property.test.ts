import { describe, expect, it } from 'vitest';
import { ALL_GOALS, GRADE_BANDS, computeCoachScore } from '@/lib/core';
import type { NormalizedAccount } from '@/lib/core';

/** Deterministic LCG so the property sweep is reproducible (no Math.random). */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomAccount(rng: () => number): NormalizedAccount {
  const townHall = randInt(rng, 11, 18);
  const heroCount = randInt(rng, 3, 5);
  const heroes = Array.from({ length: heroCount }, (_, i) => {
    const maxLevel = randInt(rng, 20, 100);
    return {
      id: `hero-${i}`,
      level: randInt(rng, 0, maxLevel),
      maxLevel,
      deCostWeight: 0.8 + rng() * 0.7,
    };
  });
  const elements = (prefix: string) =>
    Array.from({ length: randInt(rng, 1, 4) }, (_, i) => {
      const maxLevel = randInt(rng, 5, 20);
      return {
        id: `${prefix}-${i}`,
        level: randInt(rng, 0, maxLevel),
        maxLevel,
        weight: 1 + rng() * 4,
      };
    });
  const total = randInt(rng, 50, 300);
  const equipmentAvailable = townHall >= 16;
  return {
    townHall,
    heroes,
    offense: elements('off'),
    defense: elements('def'),
    walls: { atOrAboveThMax: randInt(rng, 0, total), total },
    equipment: equipmentAvailable
      ? {
          available: true,
          keyEpicsUnlocked: randInt(rng, 0, 8),
          keyEpicsTotal: 8,
          levelSum: randInt(rng, 0, 120),
          maxLevelSum: 120,
        }
      : {
          available: false,
          keyEpicsUnlocked: 0,
          keyEpicsTotal: 0,
          levelSum: 0,
          maxLevelSum: 0,
        },
    clan: {
      donationBehavior: rng(),
      warContribution: rng(),
      capitalContribution: rng(),
      activitySignal: rng(),
    },
    progression: elements('prog'),
  };
}

function expectedGrade(score: number): string {
  const band = GRADE_BANDS.find((b) => score >= b.min);
  return band ? band.grade : 'F';
}

describe('computeCoachScore — invariants over 200 random accounts × all goals', () => {
  const rng = makeRng(20260617);
  const accounts = Array.from({ length: 200 }, () => randomAccount(rng));

  it('keeps the composite and all sub-scores within [0, 100]', () => {
    for (const account of accounts) {
      for (const goal of ALL_GOALS) {
        const r = computeCoachScore(account, goal);
        expect(r.overall).toBeGreaterThanOrEqual(0);
        expect(r.overall).toBeLessThanOrEqual(100);
        for (const key of [
          'heroes',
          'offense',
          'defense',
          'progression',
          'walls',
          'clanValue',
        ] as const) {
          expect(r.subScores[key]).toBeGreaterThanOrEqual(0);
          expect(r.subScores[key]).toBeLessThanOrEqual(100);
        }
        const eq = r.subScores.equipment;
        if (eq !== null) {
          expect(eq).toBeGreaterThanOrEqual(0);
          expect(eq).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('is deterministic: identical inputs yield identical results', () => {
    for (const account of accounts.slice(0, 50)) {
      for (const goal of ALL_GOALS) {
        expect(computeCoachScore(account, goal)).toEqual(
          computeCoachScore(account, goal),
        );
      }
    }
  });

  it('assigns Equipment N/A exactly below TH16', () => {
    for (const account of accounts) {
      const r = computeCoachScore(account, 'progress');
      if (account.townHall < 16) {
        expect(r.subScores.equipment).toBeNull();
      } else {
        expect(r.subScores.equipment).not.toBeNull();
      }
    }
  });

  it('keeps the grade consistent with the rounded composite', () => {
    for (const account of accounts) {
      for (const goal of ALL_GOALS) {
        const r = computeCoachScore(account, goal);
        expect(r.grade).toBe(expectedGrade(r.overallRounded));
      }
    }
  });

  it('produces gap lists that are sorted and contain only real gaps', () => {
    for (const account of accounts) {
      const r = computeCoachScore(account, 'progress');
      for (const gap of r.gaps) {
        expect(gap.completion).toBeLessThan(1);
        expect(gap.priority).toBeGreaterThanOrEqual(0);
      }
      const priorities = r.gaps.map((g) => g.priority);
      expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
    }
  });
});
