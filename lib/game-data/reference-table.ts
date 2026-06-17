/**
 * Game-Data Reference Table — Town Halls 11–18.
 *
 * VERIFIED values (needsVerification: false) come from an authoritative source:
 *   - TH13 hero caps BK 75 / AQ 75 / GW 55 / RC 25  (deep-dive §7.2 worked example)
 *   - TH14 hero caps BK 80 / AQ 80 / GW 60 / RC 30  (deep-dive §7.7 worked example)
 *   - Equipment is N/A below TH16                    (deep-dive §7.2)
 *   - Hero unlock Town Halls for the canonical four (GW @ TH11, RC @ TH13)
 *
 * BEST-EFFORT values (needsVerification: true) are structurally present so the
 * engine is usable, but MUST be confirmed against the live game before they
 * back a paid report. The patch watcher reports this debt; nothing here is a
 * fabricated certainty. Full per-element building/troop/spell/trap tables are a
 * dedicated data-entry task tracked under `categories[*].needsVerification`.
 *
 * Bump `version` + `effectiveFrom` on every game patch (TECH_DECISIONS.md).
 */

import type {
  GameDataReference,
  HeroCap,
  HeroId,
  TownHallReference,
} from './types';

const WEIGHTS: Readonly<Record<HeroId, number>> = {
  // Relative DE cost-to-max proxies — GW/RC are the expensive heroes.
  barbarianKing: 1.0,
  archerQueen: 1.0,
  grandWarden: 1.3,
  royalChampion: 1.4,
  minionPrince: 0.9,
  dragonDuke: 1.2,
};

/** An unlocked hero. */
function unlocked(
  id: HeroId,
  maxLevel: number,
  needsVerification: boolean,
): HeroCap {
  return {
    unlocked: true,
    maxLevel,
    deCostWeight: WEIGHTS[id],
    needsVerification,
  };
}

/** A hero not yet unlocked at this Town Hall. */
function locked(needsVerification: boolean): HeroCap {
  return { unlocked: false, maxLevel: 0, deCostWeight: 0, needsVerification };
}

function townHall(
  th: number,
  heroes: Record<HeroId, HeroCap>,
  opts: {
    equipment: TownHallReference['equipment'];
    walls: number;
    offense: number;
    defense: number;
  },
): TownHallReference {
  return {
    townHall: th,
    previousTownHall: th - 1,
    heroes,
    equipment: opts.equipment,
    categories: {
      offense: {
        representativeMaxLevel: opts.offense,
        needsVerification: true,
        note: 'Per-element troop/spell/siege table pending patch-watcher data task.',
      },
      defense: {
        representativeMaxLevel: opts.defense,
        needsVerification: true,
        note: 'Per-element defensive building/trap table pending patch-watcher data task.',
      },
      walls: {
        representativeMaxLevel: opts.walls,
        needsVerification: true,
        note: 'Wall max level per TH; confirm against live game.',
      },
    },
    // No TH is fully verified yet: category tables carry known verification debt.
    fullyVerified: false,
    sourceNotes:
      th === 13 || th === 14
        ? 'Hero caps verified from COACHSCORE_DEEP_DIVE_REPORT.md worked example.'
        : 'Hero caps best-effort; confirm against live game.',
  };
}

const EQUIP_NA = { available: false } as const;

export const GAME_DATA_REFERENCE: GameDataReference = {
  version: '0.1.0-th18',
  effectiveFrom: '2026-06-17',
  gameVersionNote:
    'Town Hall 18 era (Nov 2025); Dragon Duke (6th hero) shipped Mar 2026. ' +
    'Hero Journey + Global Chat ~Jun 2026.',
  townHalls: {
    11: townHall(
      11,
      {
        barbarianKing: unlocked('barbarianKing', 50, true),
        archerQueen: unlocked('archerQueen', 50, true),
        grandWarden: unlocked('grandWarden', 20, true),
        royalChampion: locked(false),
        minionPrince: locked(true),
        dragonDuke: locked(true),
      },
      { equipment: EQUIP_NA, walls: 12, offense: 9, defense: 13 },
    ),
    12: townHall(
      12,
      {
        barbarianKing: unlocked('barbarianKing', 65, true),
        archerQueen: unlocked('archerQueen', 65, true),
        grandWarden: unlocked('grandWarden', 40, true),
        royalChampion: locked(false),
        minionPrince: locked(true),
        dragonDuke: locked(true),
      },
      { equipment: EQUIP_NA, walls: 13, offense: 10, defense: 14 },
    ),
    13: townHall(
      13,
      {
        // VERIFIED from deep-dive §7.2.
        barbarianKing: unlocked('barbarianKing', 75, false),
        archerQueen: unlocked('archerQueen', 75, false),
        grandWarden: unlocked('grandWarden', 55, false),
        royalChampion: unlocked('royalChampion', 25, false),
        minionPrince: locked(true),
        dragonDuke: locked(true),
      },
      { equipment: EQUIP_NA, walls: 14, offense: 11, defense: 15 },
    ),
    14: townHall(
      14,
      {
        // VERIFIED from deep-dive §7.7.
        barbarianKing: unlocked('barbarianKing', 80, false),
        archerQueen: unlocked('archerQueen', 80, false),
        grandWarden: unlocked('grandWarden', 60, false),
        royalChampion: unlocked('royalChampion', 30, false),
        minionPrince: locked(true),
        dragonDuke: locked(true),
      },
      { equipment: EQUIP_NA, walls: 15, offense: 12, defense: 16 },
    ),
    15: townHall(
      15,
      {
        barbarianKing: unlocked('barbarianKing', 90, true),
        archerQueen: unlocked('archerQueen', 90, true),
        grandWarden: unlocked('grandWarden', 65, true),
        royalChampion: unlocked('royalChampion', 40, true),
        minionPrince: locked(true),
        dragonDuke: locked(true),
      },
      { equipment: EQUIP_NA, walls: 16, offense: 13, defense: 17 },
    ),
    16: townHall(
      16,
      {
        barbarianKing: unlocked('barbarianKing', 95, true),
        archerQueen: unlocked('archerQueen', 95, true),
        grandWarden: unlocked('grandWarden', 70, true),
        royalChampion: unlocked('royalChampion', 45, true),
        minionPrince: unlocked('minionPrince', 40, true),
        dragonDuke: locked(true),
      },
      {
        equipment: {
          available: true,
          keyEpicsTotal: 6,
          maxLevel: 15,
          needsVerification: true,
        },
        walls: 17,
        offense: 14,
        defense: 18,
      },
    ),
    17: townHall(
      17,
      {
        barbarianKing: unlocked('barbarianKing', 100, true),
        archerQueen: unlocked('archerQueen', 100, true),
        grandWarden: unlocked('grandWarden', 75, true),
        royalChampion: unlocked('royalChampion', 50, true),
        minionPrince: unlocked('minionPrince', 60, true),
        dragonDuke: unlocked('dragonDuke', 30, true),
      },
      {
        equipment: {
          available: true,
          keyEpicsTotal: 8,
          maxLevel: 18,
          needsVerification: true,
        },
        walls: 17,
        offense: 15,
        defense: 19,
      },
    ),
    18: townHall(
      18,
      {
        barbarianKing: unlocked('barbarianKing', 105, true),
        archerQueen: unlocked('archerQueen', 105, true),
        grandWarden: unlocked('grandWarden', 80, true),
        royalChampion: unlocked('royalChampion', 55, true),
        minionPrince: unlocked('minionPrince', 70, true),
        dragonDuke: unlocked('dragonDuke', 50, true),
      },
      {
        equipment: {
          available: true,
          keyEpicsTotal: 8,
          maxLevel: 21,
          needsVerification: true,
        },
        walls: 18,
        offense: 16,
        defense: 20,
      },
    ),
  },
};

/** Lowest / highest Town Hall covered by the table. */
export const MIN_TOWN_HALL = 11;
export const MAX_TOWN_HALL = 18;
