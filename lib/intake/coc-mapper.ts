/**
 * Map an official Clash of Clans API player into source-agnostic `IntakeFields`.
 *
 * This is the core of the "paste your tag → objective score" magic moment: it
 * turns authoritative in-game data into the engine's inputs, with ZERO user
 * self-reporting. What the API can and cannot give us drives the design:
 *
 *  - Heroes      → mapped to per-hero levels and scored against the Game-Data
 *                  Reference Table's per-Town-Hall caps (objective, exact).
 *  - Offense     → home troops + spells completion. Item `maxLevel` from the API
 *                  is the ABSOLUTE in-game max (not the per-TH cap — verified),
 *                  so this is honest "army/lab development toward max", strongest
 *                  near the endgame Town Halls we target (TH16–18).
 *  - Equipment   → home hero-equipment completion (TH16+; equipment caps are
 *                  reached at the TH16 Blacksmith, so the absolute max IS the cap).
 *  - Progression → derived rush proxy from hero + offense completion.
 *  - Clan value  → derived from real donation/war/capital/activity signals.
 *  - Defense + Walls → the API exposes NEITHER (no building/wall data), so they
 *                  are marked `unknownDimensions` → the engine drops them and the
 *                  UI invites a screenshot to complete them.
 *
 * Pure: a function of the API payload (+ reference table) only.
 */

import { clamp, EQUIPMENT_MIN_TOWN_HALL } from '@/lib/core';
import {
  ALL_HERO_IDS,
  getTownHallReference,
  type HeroId,
  type TownHallReference,
} from '@/lib/game-data';
import type { CocPlayer, CocPlayerItem } from './coc-api-schema';
import type { ClanSignals, EquipmentFields, IntakeFields } from './types';

const HERO_NAME_TO_ID: Readonly<Record<string, HeroId>> = {
  'barbarian king': 'barbarianKing',
  'archer queen': 'archerQueen',
  'grand warden': 'grandWarden',
  'royal champion': 'royalChampion',
  'minion prince': 'minionPrince',
  'dragon duke': 'dragonDuke',
};

/** Home-village items only (the API mixes in builder-base entries). */
function homeItems(items: readonly CocPlayerItem[]): CocPlayerItem[] {
  return items.filter((i) => (i.village ?? 'home') === 'home');
}

/** Average completion (0..100) of a set of items vs their (absolute) max. */
function averageCompletion(items: readonly CocPlayerItem[]): number {
  let level = 0;
  let max = 0;
  for (const it of items) {
    if (it.maxLevel > 0) {
      level += Math.max(0, it.level);
      max += it.maxLevel;
    }
  }
  return max > 0 ? clamp((level / max) * 100, 0, 100) : 0;
}

/** Map the API heroes array → per-hero levels, home village only. */
function heroLevels(player: CocPlayer): Partial<Record<HeroId, number>> {
  const out: Partial<Record<HeroId, number>> = {};
  for (const hero of homeItems(player.heroes)) {
    const id = HERO_NAME_TO_ID[hero.name.trim().toLowerCase()];
    if (id) out[id] = Math.max(0, hero.level);
  }
  return out;
}

/** Unweighted hero completion (0..100) vs this TH's caps — a progression input. */
function heroCompletion(
  levels: Partial<Record<HeroId, number>>,
  ref: TownHallReference,
): number {
  let sum = 0;
  let count = 0;
  for (const id of ALL_HERO_IDS) {
    const cap = ref.heroes[id];
    if (!cap.unlocked || cap.maxLevel <= 0) continue;
    sum += clamp((levels[id] ?? 0) / cap.maxLevel, 0, 1);
    count += 1;
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

/**
 * Offense (army/lab) completion: home troops (excluding Super Troop boosted
 * duplicates) + home spells. Pets and siege machines are included — they're real
 * offensive progression.
 */
function offenseCompletion(player: CocPlayer): number {
  const troops = homeItems(player.troops).filter(
    (t) => !t.name.startsWith('Super '),
  );
  const spells = homeItems(player.spells);
  return averageCompletion([...troops, ...spells]);
}

/** Equipment fields (TH16+) from the owned home hero-equipment inventory. */
function equipmentFields(
  player: CocPlayer,
  ref: TownHallReference,
): EquipmentFields | undefined {
  if (!ref.equipment.available) return undefined;
  const owned = homeItems(player.heroEquipment);
  const levelSum = owned.reduce((n, e) => n + Math.max(0, e.level), 0);
  const maxLevelSum = owned.reduce((n, e) => n + Math.max(0, e.maxLevel), 0);
  // We can't read rarity from the API; approximate "key epics unlocked" as the
  // count of owned (level > 0) pieces, capped to the reference total.
  const ownedCount = owned.filter((e) => e.level > 0).length;
  return {
    keyEpicsUnlocked: Math.min(ownedCount, ref.equipment.keyEpicsTotal),
    levelSum,
    maxLevelSum,
  };
}

/** Derive clan-value signals (each 0..1) from real API counters. Heuristic. */
function clanSignals(player: CocPlayer): ClanSignals {
  const inClan = player.clan !== undefined;
  const donationBehavior = clamp((player.donations ?? 0) / 2000, 0, 1);
  const warContribution = clamp(
    (player.warStars ?? 0) / 1500 + (player.warPreference === 'in' ? 0.15 : 0),
    0,
    1,
  );
  const capitalContribution = clamp(
    (player.clanCapitalContributions ?? 0) / 200_000,
    0,
    1,
  );
  const activitySignal = clamp(
    (player.attackWins ?? 0) / 300 + (inClan ? 0.2 : 0),
    0,
    1,
  );
  return {
    donationBehavior,
    warContribution,
    capitalContribution,
    activitySignal,
  };
}

/**
 * Build `IntakeFields` from a validated API player. Defense and Walls are marked
 * unknown (the API can't read them); everything else is objective.
 */
export function mapCocPlayerToFields(player: CocPlayer): IntakeFields {
  const townHall = player.townHallLevel;
  const ref = getTownHallReference(townHall);
  const levels = heroLevels(player);

  const offensePercent = Math.round(offenseCompletion(player));
  const heroPct = heroCompletion(levels, ref);
  // Progression / "rush" proxy: a well-developed account has high hero + lab
  // completion for its Town Hall; a rushed one lags. Blend both objective inputs.
  const progressionPercent = Math.round(0.5 * heroPct + 0.5 * offensePercent);

  const equipment =
    townHall >= EQUIPMENT_MIN_TOWN_HALL
      ? equipmentFields(player, ref)
      : undefined;

  return {
    townHall,
    heroLevels: levels,
    offensePercent,
    // Placeholders — ignored because defense/walls are listed as unknown below.
    defensePercent: 0,
    progressionPercent,
    walls: { atOrAboveThMax: 0, total: 0 },
    equipment,
    clan: clanSignals(player),
    unknownDimensions: ['defense', 'walls'],
  };
}
