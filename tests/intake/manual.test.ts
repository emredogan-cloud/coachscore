import { describe, expect, it } from 'vitest';
import { scoreSnapshot } from '@/lib/snapshot';
import { intakeManual } from '@/lib/intake';
import type { IntakeFields } from '@/lib/intake';

const fields: IntakeFields = {
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
    donationBehavior: 0.78,
    warContribution: 0.78,
    capitalContribution: 0.78,
    activitySignal: 0.78,
  },
};

describe('intakeManual', () => {
  it('produces a scoreable, version-locked snapshot', () => {
    const result = intakeManual({ goal: 'war', fields });
    expect(result.ok).toBe(true);
    expect(result.source).toBe('manual');
    expect(result.snapshot).not.toBeNull();
    expect(result.notActivated).toBe(false);
    if (!result.snapshot) return;
    const score = scoreSnapshot(result.snapshot);
    expect(score.grade).toBe('A');
  });

  it('flags TH14 reference data as not paid-ready (verification debt)', () => {
    const result = intakeManual({ goal: 'war', fields });
    expect(result.referenceReady).toBe(false);
  });

  it('rejects an out-of-range Town Hall', () => {
    const result = intakeManual({
      goal: 'war',
      fields: { ...fields, townHall: 5 },
    });
    expect(result.ok).toBe(false);
    expect(result.snapshot).toBeNull();
    expect(result.errors[0]).toMatch(/Town Hall 5 is outside/);
  });
});
