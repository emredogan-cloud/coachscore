import { describe, expect, it } from 'vitest';
import {
  ALL_GOALS,
  EQUIPMENT_MIN_TOWN_HALL,
  WEIGHT_PROFILES,
  selectWeightProfile,
} from '@/lib/core';
import type { SubScoreKey } from '@/lib/core';

const KEYS: SubScoreKey[] = [
  'heroes',
  'offense',
  'defense',
  'equipment',
  'progression',
  'walls',
  'clanValue',
];

function sum(profile: Readonly<Record<SubScoreKey, number>>): number {
  return KEYS.reduce((acc, k) => acc + profile[k], 0);
}

describe('weight profiles', () => {
  it('every goal profile (both variants) sums to 1.0', () => {
    for (const goal of ALL_GOALS) {
      const { below16, th16plus } = WEIGHT_PROFILES[goal];
      expect(sum(below16)).toBeCloseTo(1, 9);
      expect(sum(th16plus)).toBeCloseTo(1, 9);
    }
  });

  it('assigns zero Equipment weight below TH16 and positive at/above', () => {
    for (const goal of ALL_GOALS) {
      expect(WEIGHT_PROFILES[goal].below16.equipment).toBe(0);
      expect(WEIGHT_PROFILES[goal].th16plus.equipment).toBeGreaterThan(0);
    }
  });

  it('matches the deep-dive §7.7 war/below16 profile exactly', () => {
    expect(WEIGHT_PROFILES.war.below16).toEqual({
      heroes: 0.28,
      offense: 0.24,
      defense: 0.18,
      progression: 0.18,
      equipment: 0,
      walls: 0.06,
      clanValue: 0.06,
    });
  });

  it('selects the variant by Town Hall', () => {
    expect(selectWeightProfile('war', 15)).toBe(WEIGHT_PROFILES.war.below16);
    expect(selectWeightProfile('war', EQUIPMENT_MIN_TOWN_HALL)).toBe(
      WEIGHT_PROFILES.war.th16plus,
    );
    expect(selectWeightProfile('war', 18)).toBe(WEIGHT_PROFILES.war.th16plus);
  });

  it('treats "rate" as the balanced default profile', () => {
    expect(WEIGHT_PROFILES.rate).toBe(WEIGHT_PROFILES.progress);
  });
});
