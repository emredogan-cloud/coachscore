import { describe, expect, it } from 'vitest';
import { ARMY_CATALOG, getArmy } from '@/lib/armies';
import {
  assessWarReadiness,
  heroCompletion,
  recommendArmies,
  type WarGoal,
  type WarInput,
} from '@/lib/war';

const TH_RANGE = [11, 12, 13, 14, 15, 16, 17, 18] as const;
const GOALS: WarGoal[] = ['war', 'cwl', 'trophy', 'farming', 'legends'];

const input = (over: Partial<WarInput>): WarInput => ({
  townHall: 16,
  heroLevels: {},
  labLevelPct: 70,
  goal: 'war',
  ...over,
});

// Maxed TH16 (verified caps) for the "elite" cases.
const MAXED_TH16: WarInput = {
  townHall: 16,
  heroLevels: {
    barbarianKing: 95,
    archerQueen: 95,
    grandWarden: 70,
    royalChampion: 45,
    minionPrince: 80,
    dragonDuke: 25, // unlocks at TH15; part of a maxed TH16
  },
  labLevelPct: 100,
  goal: 'war',
};

describe('army catalog integrity', () => {
  it.each(ARMY_CATALOG)('army "$id" is well-formed', (army) => {
    expect(army.name.length).toBeGreaterThan(0);
    expect(army.minTownHall).toBeGreaterThanOrEqual(1);
    expect(army.goals.length).toBeGreaterThan(0);
    expect(army.minHeroCompletion).toBeGreaterThanOrEqual(0);
    expect(army.minHeroCompletion).toBeLessThanOrEqual(1);
    expect(army.minLabPct).toBeGreaterThanOrEqual(0);
    expect(army.minLabPct).toBeLessThanOrEqual(100);
    expect(army.why.length).toBeGreaterThan(20);
    expect(['S', 'A', 'B', 'C']).toContain(army.tier);
  });

  it('has unique army ids', () => {
    const ids = ARMY_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// 10 armies × 10 Town Halls = 100 cases asserting the never-impossible invariant.
const matrix = ARMY_CATALOG.flatMap((a) =>
  TH_RANGE.map((th) => ({ id: a.id, th, minTh: a.minTownHall })),
);

describe('never recommends an impossible army (minTH invariant)', () => {
  it.each(matrix)(
    'TH$th recs respect minTH; army $id below minTH is absent',
    ({ id, th, minTh }) => {
      const recs = recommendArmies(
        input({ townHall: th, heroLevels: { barbarianKing: 40 } }),
      );
      // Every recommendation must be fieldable at this TH.
      for (const r of recs) {
        expect(getArmy(r.id)!.minTownHall).toBeLessThanOrEqual(th);
      }
      // The specific army must not appear when the TH is too low.
      if (th < minTh) {
        expect(recs.some((r) => r.id === id)).toBe(false);
      }
    },
  );
});

describe('goal filtering', () => {
  it.each(GOALS)(
    'returns only goal-appropriate armies for goal=%s (TH16)',
    (goal) => {
      const recs = recommendArmies(input({ goal }));
      // When at least one army fits the goal, all recs must include that goal.
      const anyForGoal = ARMY_CATALOG.some(
        (a) => a.minTownHall <= 16 && a.goals.includes(goal),
      );
      if (anyForGoal) {
        for (const r of recs) {
          expect(getArmy(r.id)!.goals).toContain(goal);
        }
      }
    },
  );
});

describe('heroCompletion', () => {
  it('is 0 with no hero levels', () => {
    expect(heroCompletion(input({ heroLevels: {} }))).toBe(0);
  });
  it('is ~1 for a maxed TH16 account', () => {
    expect(heroCompletion(MAXED_TH16)).toBeCloseTo(1, 1);
  });
  it.each(TH_RANGE)('stays within [0,1] at TH%d', (th) => {
    const v = heroCompletion(
      input({ townHall: th, heroLevels: { barbarianKing: 30 } }),
    );
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('assessWarReadiness', () => {
  it('rates a maxed TH16 account Elite War Ready / CWL Ready', () => {
    const r = assessWarReadiness(MAXED_TH16);
    expect(r.score).toBeGreaterThanOrEqual(88);
    expect(r.tier).toBe('Elite War Ready');
    expect(r.warTier).toBe('CWL Ready');
    expect(r.timeToReadyDays).toBe(0);
    expect(r.recommendedArmies[0]?.ready).toBe(true);
  });

  it('rates a fresh TH16 account Not Ready with upgrade priorities + ETA', () => {
    const r = assessWarReadiness(input({ heroLevels: {}, labLevelPct: 20 }));
    expect(r.tier).toBe('Not Ready');
    expect(r.upgradePriorities.length).toBeGreaterThan(0);
    expect(r.timeToReadyDays).toBeGreaterThan(0);
    expect(r.missingRequirements.length).toBeGreaterThan(0);
  });

  it('always recommends fieldable armies + carries the meta version', () => {
    const r = assessWarReadiness(input({ townHall: 13, labLevelPct: 60 }));
    expect(r.recommendedArmies.length).toBeGreaterThan(0);
    for (const a of r.recommendedArmies) {
      expect(getArmy(a.id)!.minTownHall).toBeLessThanOrEqual(13);
    }
    expect(r.metaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it.each(TH_RANGE)(
    'produces a valid assessment at TH%d for every goal',
    (th) => {
      for (const goal of GOALS) {
        const r = assessWarReadiness(
          input({ townHall: th, goal, labLevelPct: 75 }),
        );
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
        expect([
          'Not Ready',
          'Partially Ready',
          'War Ready',
          'Elite War Ready',
        ]).toContain(r.tier);
        expect(['Casual War', 'Competitive War', 'CWL Ready']).toContain(
          r.warTier,
        );
      }
    },
  );

  it('is deterministic (same input → same output)', () => {
    const a = assessWarReadiness(MAXED_TH16);
    const b = assessWarReadiness(MAXED_TH16);
    expect(a).toEqual(b);
  });

  it('readiness rises monotonically with development', () => {
    const low = assessWarReadiness(
      input({ heroLevels: {}, labLevelPct: 20 }),
    ).score;
    const mid = assessWarReadiness(
      input({
        heroLevels: { barbarianKing: 60, archerQueen: 60 },
        labLevelPct: 60,
      }),
    ).score;
    const high = assessWarReadiness(MAXED_TH16).score;
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });
});
