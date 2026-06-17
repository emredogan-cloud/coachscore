import { describe, expect, it } from 'vitest';
import { buildGapList, selectWeightProfile } from '@/lib/core';
import type { NormalizedAccount } from '@/lib/core';
import { TH16_MAXED } from './fixtures';

const profileFor = (account: NormalizedAccount) =>
  selectWeightProfile('progress', account.townHall);

describe('buildGapList', () => {
  it('returns no gaps for a maxed account', () => {
    expect(buildGapList(TH16_MAXED, profileFor(TH16_MAXED))).toHaveLength(0);
  });

  it('includes only below-target elements', () => {
    const account: NormalizedAccount = {
      ...TH16_MAXED,
      heroes: [
        { id: 'barbarianKing', level: 95, maxLevel: 95, deCostWeight: 1 }, // maxed → excluded
        { id: 'grandWarden', level: 50, maxLevel: 70, deCostWeight: 1.3 }, // gap
      ],
    };
    const gaps = buildGapList(account, profileFor(account));
    const ids = gaps.map((g) => g.id);
    expect(ids).toContain('grandWarden');
    expect(ids).not.toContain('barbarianKing');
  });

  it('emits an equipment gap only at TH16+ when below 100', () => {
    const account: NormalizedAccount = {
      ...TH16_MAXED,
      equipment: {
        available: true,
        keyEpicsUnlocked: 3,
        keyEpicsTotal: 6,
        levelSum: 30,
        maxLevelSum: 90,
      },
    };
    const gaps = buildGapList(account, profileFor(account));
    expect(gaps.some((g) => g.category === 'equipment')).toBe(true);
  });

  it('emits a walls gap when walls are incomplete', () => {
    const account: NormalizedAccount = {
      ...TH16_MAXED,
      walls: { atOrAboveThMax: 60, total: 100 },
    };
    const gaps = buildGapList(account, profileFor(account));
    const wallGap = gaps.find((g) => g.category === 'walls');
    expect(wallGap).toBeDefined();
    expect(wallGap?.completion).toBeCloseTo(0.6, 6);
  });

  it('computes priority = impact × under-completion ÷ cost', () => {
    const account: NormalizedAccount = {
      ...TH16_MAXED,
      heroes: [{ id: 'grandWarden', level: 35, maxLevel: 70, deCostWeight: 2 }],
      offense: [{ id: 'troops', level: 100, maxLevel: 100, weight: 1 }],
      defense: [{ id: 'defenses', level: 100, maxLevel: 100, weight: 1 }],
      walls: { atOrAboveThMax: 100, total: 100 },
      equipment: {
        available: true,
        keyEpicsUnlocked: 6,
        keyEpicsTotal: 6,
        levelSum: 90,
        maxLevelSum: 90,
      },
    };
    const profile = profileFor(account);
    const gaps = buildGapList(account, profile);
    const gw = gaps.find((g) => g.id === 'grandWarden');
    expect(gw).toBeDefined();
    // completion 0.5 → under 0.5; impact = heroes weight; cost = 2.
    const expected = (profile.heroes * 0.5) / 2;
    expect(gw?.priority).toBeCloseTo(expected, 9);
  });

  it('is deterministically ordered (priority desc, stable tie-breaks)', () => {
    const account: NormalizedAccount = {
      ...TH16_MAXED,
      heroes: [
        { id: 'archerQueen', level: 80, maxLevel: 95, deCostWeight: 1 },
        { id: 'barbarianKing', level: 80, maxLevel: 95, deCostWeight: 1 },
      ],
    };
    const profile = profileFor(account);
    const a = buildGapList(account, profile).map((g) => g.id);
    const b = buildGapList(account, profile).map((g) => g.id);
    expect(a).toEqual(b);
    // Equal priority + under-completion → alphabetical id tie-break.
    const heroIds = buildGapList(account, profile)
      .filter((g) => g.category === 'heroes')
      .map((g) => g.id);
    expect(heroIds).toEqual(['archerQueen', 'barbarianKing']);
  });
});
