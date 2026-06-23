import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import { normalizeIntake } from '@/lib/intake';
import type { IntakeFields } from '@/lib/intake';

function th14Fields(overrides: Partial<IntakeFields> = {}): IntakeFields {
  return {
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
    ...overrides,
  };
}

describe('normalizeIntake', () => {
  it('reads hero caps + DE weights from the reference table and drops locked heroes', () => {
    const account = normalizeIntake(th14Fields());
    const ids = account.heroes.map((h) => h.id);
    // TH14 unlocks BK/AQ/GW/RC; MinionPrince + DragonDuke are locked.
    expect(ids).toEqual([
      'barbarianKing',
      'archerQueen',
      'grandWarden',
      'royalChampion',
    ]);
    const bk = account.heroes.find((h) => h.id === 'barbarianKing');
    expect(bk?.maxLevel).toBe(80);
    expect(bk?.deCostWeight).toBe(1.0);
    const rc = account.heroes.find((h) => h.id === 'royalChampion');
    expect(rc?.maxLevel).toBe(30);
    expect(rc?.deCostWeight).toBe(1.4);
  });

  it('clamps hero levels to the cap and defaults missing heroes to 0', () => {
    const account = normalizeIntake(
      th14Fields({ heroLevels: { barbarianKing: 999 } }),
    );
    const bk = account.heroes.find((h) => h.id === 'barbarianKing');
    const aq = account.heroes.find((h) => h.id === 'archerQueen');
    expect(bk?.level).toBe(80); // clamped to max
    expect(aq?.level).toBe(0); // missing → 0
  });

  it('marks equipment N/A below TH16', () => {
    const account = normalizeIntake(th14Fields());
    expect(account.equipment.available).toBe(false);
  });

  it('reconciles equipment against the reference at TH16+', () => {
    const account = normalizeIntake({
      townHall: 16,
      heroLevels: { barbarianKing: 90 },
      offensePercent: 50,
      defensePercent: 50,
      progressionPercent: 50,
      walls: { atOrAboveThMax: 10, total: 100 },
      equipment: { keyEpicsUnlocked: 99, levelSum: 40, maxLevelSum: 90 },
      clan: {
        donationBehavior: 1,
        warContribution: 1,
        capitalContribution: 1,
        activitySignal: 1,
      },
    });
    expect(account.equipment.available).toBe(true);
    // keyEpicsTotal comes from the reference (6 at TH16); unlocked is clamped.
    expect(account.equipment.keyEpicsTotal).toBe(6);
    expect(account.equipment.keyEpicsUnlocked).toBe(6);
  });

  it('produces an account the engine can score', () => {
    const account = normalizeIntake(th14Fields());
    const result = computeCoachScore(account, 'war');
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    // The TH14 war worked example lands around Grade A.
    expect(result.grade).toBe('A');
  });

  it('carries progression against the previous Town Hall', () => {
    const account = normalizeIntake(th14Fields());
    expect(account.progression[0]?.id).toBe('vs-th13');
    expect(account.progression[0]?.level).toBe(93);
  });
});
