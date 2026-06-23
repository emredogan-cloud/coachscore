import { describe, expect, it } from 'vitest';
import {
  assessCompleteness,
  extractionConfidence,
  manualConfidence,
} from '@/lib/intake';
import type { IntakeFields } from '@/lib/intake';
import type { ExtractedField } from '@/lib/ai';

const completeTh14: IntakeFields = {
  townHall: 14,
  heroLevels: {
    barbarianKing: 72,
    archerQueen: 75,
    grandWarden: 48,
    royalChampion: 22,
  },
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

describe('assessCompleteness / manualConfidence', () => {
  it('is fully confident when all expected fields are present', () => {
    expect(assessCompleteness(completeTh14)).toEqual([]);
    expect(manualConfidence(completeTh14).score).toBe(1);
  });

  it('flags missing unlocked-hero levels and docks confidence', () => {
    const c = manualConfidence({
      ...completeTh14,
      heroLevels: { barbarianKing: 72 },
    });
    expect(c.fieldsNeedingConfirmation).toContain('hero:archerQueen');
    expect(c.fieldsNeedingConfirmation).toContain('hero:royalChampion');
    expect(c.score).toBeLessThan(1);
    expect(c.score).toBeGreaterThanOrEqual(0.4);
  });

  it('flags missing equipment at TH16+', () => {
    const missing = assessCompleteness({
      ...completeTh14,
      townHall: 16,
      heroLevels: {
        barbarianKing: 90,
        archerQueen: 90,
        grandWarden: 70,
        royalChampion: 45,
        minionPrince: 40,
      },
    });
    expect(missing).toContain('equipment');
  });

  it('flags missing walls', () => {
    expect(
      assessCompleteness({
        ...completeTh14,
        walls: { atOrAboveThMax: 0, total: 0 },
      }),
    ).toContain('walls');
  });
});

describe('extractionConfidence', () => {
  const field = (
    key: string,
    confidence: number,
    needsConfirmation: boolean,
  ): ExtractedField => ({ key, value: 1, confidence, needsConfirmation });

  it('returns 0 for no fields', () => {
    expect(extractionConfidence([]).score).toBe(0);
  });

  it('averages confidence and lists low-confidence keys', () => {
    const c = extractionConfidence([
      field('barbarianKing', 0.9, false),
      field('offensePercent', 0.4, true),
    ]);
    expect(c.score).toBeCloseTo(0.65, 5);
    expect(c.fieldsNeedingConfirmation).toEqual(['offensePercent']);
  });
});
