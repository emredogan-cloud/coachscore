/**
 * Game-Data Reference Table — Town Halls 11–18.
 *
 * VERIFIED values (needsVerification: false) come from an authoritative source:
 *   - TH13 hero caps BK 75 / AQ 75 / GW 55 / RC 25  (deep-dive §7.2 worked example)
 *   - TH14 hero caps BK 80 / AQ 80 / GW 60 / RC 30  (deep-dive §7.7 worked example)
 *   - TH16 hero caps BK 95 / AQ 95 / GW 70 / RC 45 / MP 80 + wall L17  (Fandom, Jun 2026)
 *   - TH17 hero caps BK 100 / AQ 100 / GW 75 / RC 50 / MP 90 + wall L18 (Fandom, Jun 2026)
 *   - TH18 hero caps BK 110 / AQ 110 / GW 85 / RC 55 / MP 95 + wall L19 (Fandom, Jun 2026; TH18 = max TH)
 *   - Equipment is N/A below TH16                    (deep-dive §7.2)
 *   - Hero unlock Town Halls for the canonical four (GW @ TH11, RC @ TH13)
 *
 * STILL best-effort at TH16–18 (needsVerification stays true): Dragon Duke's
 * per-TH caps (newest hero, undocumented), the equipment epic count, and the
 * per-element offense/defense tables. These do NOT determine the tag-path score
 * (offense comes from the live API; defense/walls it can't read are excluded),
 * so paid readiness is gated on the verified hero caps + walls — see readiness.ts.
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
    /** Per-category verification (default false). The wall max level is a single
     * confirmable number; offense/defense remain "representative" placeholders
     * until the per-element table lands. */
    verified?: { walls?: boolean; offense?: boolean; defense?: boolean };
    sourceNotes?: string;
  },
): TownHallReference {
  const v = opts.verified ?? {};
  return {
    townHall: th,
    previousTownHall: th - 1,
    heroes,
    equipment: opts.equipment,
    categories: {
      offense: {
        representativeMaxLevel: opts.offense,
        needsVerification: !v.offense,
        note: 'Per-element troop/spell/siege table pending patch-watcher data task.',
      },
      defense: {
        representativeMaxLevel: opts.defense,
        needsVerification: !v.defense,
        note: 'Per-element defensive building/trap table pending patch-watcher data task.',
      },
      walls: {
        representativeMaxLevel: opts.walls,
        needsVerification: !v.walls,
        note: 'Wall max level per TH.',
      },
    },
    // No TH is "fully verified" while the per-element offense/defense tables and
    // the newest hero (Dragon Duke) remain best-effort; paid readiness is gated
    // on the score-determining hero caps + walls (see lib/ai/readiness.ts).
    fullyVerified: false,
    sourceNotes:
      opts.sourceNotes ??
      (th === 13 || th === 14
        ? 'Hero caps verified from COACHSCORE_DEEP_DIVE_REPORT.md worked example.'
        : 'Hero caps best-effort; confirm against live game.'),
  };
}

const EQUIP_NA = { available: false } as const;

export const GAME_DATA_REFERENCE: GameDataReference = {
  version: '0.2.0-th18',
  effectiveFrom: '2026-06-29',
  gameVersionNote:
    'Town Hall 18 era (Nov 2025); Dragon Duke (6th hero) shipped Mar 2026. ' +
    'TH16–18 hero caps + wall levels verified vs the Fandom wiki (Jun 2026); ' +
    'Minion Prince caps corrected (TH16 80, TH17 90, TH18 95).',
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
        // Hero caps VERIFIED (Fandom Hero Hall 10) — PMF-correction sprint.
        barbarianKing: unlocked('barbarianKing', 95, false),
        archerQueen: unlocked('archerQueen', 95, false),
        grandWarden: unlocked('grandWarden', 70, false),
        royalChampion: unlocked('royalChampion', 45, false),
        minionPrince: unlocked('minionPrince', 80, false), // was 40 (stale)
        // Dragon Duke unlocks at TH15; per-TH cap not yet documented → best-effort.
        dragonDuke: unlocked('dragonDuke', 25, true),
      },
      {
        equipment: {
          available: true,
          keyEpicsTotal: 6,
          maxLevel: 27, // verified epic cap (Blacksmith maxes at TH16)
          needsVerification: true, // epic count is global/uncertain → still flagged
        },
        walls: 17, // VERIFIED
        offense: 14,
        defense: 18,
        verified: { walls: true },
        sourceNotes:
          'TH16 hero caps (BK95/AQ95/GW70/RC45/MP80) + wall L17 verified vs ' +
          'the Fandom wiki (Jun 2026). Dragon Duke cap, equipment epic count, ' +
          'and per-element offense/defense tables remain best-effort.',
      },
    ),
    17: townHall(
      17,
      {
        // Hero caps VERIFIED (Fandom Hero Hall 11) — PMF-correction sprint.
        barbarianKing: unlocked('barbarianKing', 100, false),
        archerQueen: unlocked('archerQueen', 100, false),
        grandWarden: unlocked('grandWarden', 75, false),
        royalChampion: unlocked('royalChampion', 50, false),
        minionPrince: unlocked('minionPrince', 90, false), // was 60 (stale)
        dragonDuke: unlocked('dragonDuke', 40, true),
      },
      {
        equipment: {
          available: true,
          keyEpicsTotal: 8,
          maxLevel: 27,
          needsVerification: true,
        },
        walls: 18, // VERIFIED (was 17)
        offense: 15,
        defense: 19,
        verified: { walls: true },
        sourceNotes:
          'TH17 hero caps (BK100/AQ100/GW75/RC50/MP90) + wall L18 verified vs ' +
          'the Fandom wiki (Jun 2026). Dragon Duke cap, equipment epic count, ' +
          'and per-element offense/defense tables remain best-effort.',
      },
    ),
    18: townHall(
      18,
      {
        // TH18 is the current max TH, so the absolute hero maxima ARE the TH18
        // caps — VERIFIED vs the Fandom wiki (Jun 2026). (Was 105/105/80/55/70.)
        barbarianKing: unlocked('barbarianKing', 110, false),
        archerQueen: unlocked('archerQueen', 110, false),
        grandWarden: unlocked('grandWarden', 85, false),
        royalChampion: unlocked('royalChampion', 55, false),
        minionPrince: unlocked('minionPrince', 95, false), // was 70 (stale)
        dragonDuke: unlocked('dragonDuke', 50, true),
      },
      {
        equipment: {
          available: true,
          keyEpicsTotal: 8,
          maxLevel: 27,
          needsVerification: true,
        },
        walls: 19, // VERIFIED (was 18)
        offense: 16,
        defense: 20,
        verified: { walls: true },
        sourceNotes:
          'TH18 hero caps (BK110/AQ110/GW85/RC55/MP95) + wall L19 verified vs ' +
          'the Fandom wiki (Jun 2026). Dragon Duke cap, equipment epic count, ' +
          'and per-element offense/defense tables remain best-effort.',
      },
    ),
  },
};

/** Lowest / highest Town Hall covered by the table. */
export const MIN_TOWN_HALL = 11;
export const MAX_TOWN_HALL = 18;
