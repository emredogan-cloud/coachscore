import { describe, expect, it } from 'vitest';
import { ALL_GOALS } from '@/lib/core';
import { ALL_HERO_IDS } from '@/lib/game-data';
import {
  GOAL_VALUES,
  HERO_ID_VALUES,
  ManualIntakeSchema,
  ScreenshotIntakeSchema,
  TagIntakeSchema,
} from '@/lib/intake';

const validFields = {
  townHall: 14,
  heroLevels: { barbarianKing: 72 },
  offensePercent: 85,
  defensePercent: 82,
  progressionPercent: 93,
  walls: { atOrAboveThMax: 85, total: 100 },
  clan: {
    donationBehavior: 0.5,
    warContribution: 0.5,
    capitalContribution: 0.5,
    activitySignal: 0.5,
  },
};

describe('schema literals stay in sync with the engine', () => {
  it('GOAL_VALUES matches ALL_GOALS', () => {
    expect([...GOAL_VALUES].sort()).toEqual([...ALL_GOALS].sort());
  });

  it('HERO_ID_VALUES matches ALL_HERO_IDS', () => {
    expect([...HERO_ID_VALUES].sort()).toEqual([...ALL_HERO_IDS].sort());
  });
});

describe('ManualIntakeSchema', () => {
  it('accepts a valid manual body', () => {
    const parsed = ManualIntakeSchema.safeParse({
      goal: 'war',
      fields: validFields,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a Town Hall out of range', () => {
    const parsed = ManualIntakeSchema.safeParse({
      goal: 'war',
      fields: { ...validFields, townHall: 5 },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a percent above 100 and a clan signal above 1', () => {
    expect(
      ManualIntakeSchema.safeParse({
        goal: 'war',
        fields: { ...validFields, offensePercent: 150 },
      }).success,
    ).toBe(false);
    expect(
      ManualIntakeSchema.safeParse({
        goal: 'war',
        fields: {
          ...validFields,
          clan: { ...validFields.clan, warContribution: 2 },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown goal', () => {
    expect(
      ManualIntakeSchema.safeParse({ goal: 'nope', fields: validFields })
        .success,
    ).toBe(false);
  });
});

describe('TagIntakeSchema / ScreenshotIntakeSchema', () => {
  it('validates a tag body', () => {
    expect(
      TagIntakeSchema.safeParse({ goal: 'war', playerTag: '#2PP0' }).success,
    ).toBe(true);
  });

  it('defaults context to empty string', () => {
    const parsed = ScreenshotIntakeSchema.safeParse({
      goal: 'war',
      townHall: 14,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.context).toBe('');
  });
});
