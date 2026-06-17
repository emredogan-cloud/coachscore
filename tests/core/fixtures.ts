import type { NormalizedAccount } from '@/lib/core';

/**
 * The TH14 "Win wars / CWL" account from the deep-dive §7.7 worked example.
 * Expected: Heroes ≈ 83, Offense ≈ 85, Defense ≈ 82, Progression ≈ 93 (Lightly
 * Rushed), Walls 85, Clan 78, Equipment N/A → composite ≈ 85, Grade A.
 */
export const TH14_WAR_EXAMPLE: NormalizedAccount = {
  townHall: 14,
  heroes: [
    { id: 'barbarianKing', level: 72, maxLevel: 80, deCostWeight: 1.0 },
    { id: 'archerQueen', level: 75, maxLevel: 80, deCostWeight: 1.0 },
    { id: 'grandWarden', level: 48, maxLevel: 60, deCostWeight: 1.3 },
    { id: 'royalChampion', level: 22, maxLevel: 30, deCostWeight: 1.4 },
  ],
  // Meta-army troops/spells averaging 0.85 completion (lab-time weighted).
  offense: [
    { id: 'meta-troops', level: 85, maxLevel: 100, weight: 2 },
    { id: 'meta-spells', level: 85, maxLevel: 100, weight: 1 },
  ],
  // Key war-defense buildings averaging 0.82 completion (cost weighted).
  defense: [
    { id: 'eagle-artillery', level: 82, maxLevel: 100, weight: 2 },
    { id: 'scattershots', level: 82, maxLevel: 100, weight: 1 },
  ],
  walls: { atOrAboveThMax: 85, total: 100 },
  // TH14 < 16 → equipment N/A.
  equipment: {
    available: false,
    keyEpicsUnlocked: 0,
    keyEpicsTotal: 0,
    levelSum: 0,
    maxLevelSum: 0,
  },
  clan: {
    donationBehavior: 0.78,
    warContribution: 0.78,
    capitalContribution: 0.78,
    activitySignal: 0.78,
  },
  // Completion vs. the previous Town Hall (TH13) caps ≈ 0.93.
  progression: [{ id: 'vs-th13', level: 93, maxLevel: 100, weight: 1 }],
};

/** A perfectly maxed TH16 account (every sub-score should be 100, grade S). */
export const TH16_MAXED: NormalizedAccount = {
  townHall: 16,
  heroes: [
    { id: 'barbarianKing', level: 95, maxLevel: 95, deCostWeight: 1.0 },
    { id: 'archerQueen', level: 95, maxLevel: 95, deCostWeight: 1.0 },
    { id: 'grandWarden', level: 70, maxLevel: 70, deCostWeight: 1.3 },
    { id: 'royalChampion', level: 45, maxLevel: 45, deCostWeight: 1.4 },
    { id: 'minionPrince', level: 40, maxLevel: 40, deCostWeight: 0.9 },
  ],
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
  clan: {
    donationBehavior: 1,
    warContribution: 1,
    capitalContribution: 1,
    activitySignal: 1,
  },
  progression: [{ id: 'vs-th15', level: 100, maxLevel: 100, weight: 1 }],
};
