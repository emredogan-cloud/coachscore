/**
 * War Intelligence engine (Feature 1 · P1-B). Deterministic + pure: given a
 * WarInput it returns a readiness score/tier, meta-army recommendations filtered
 * to what the account can field (never an impossible army), the missing
 * requirements, attack-focused upgrade priorities, a time-to-ready estimate, and
 * a war-tier projection — the questions players actually pay for.
 */

import { clamp } from '@/lib/core';
import {
  ALL_HERO_IDS,
  getTownHallReference,
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
  type HeroId,
  type TownHallReference,
} from '@/lib/game-data';

/** Reference row, or null when the Town Hall is outside the covered range (so
 *  the engine degrades gracefully instead of throwing). */
function safeRef(townHall: number): TownHallReference | null {
  if (townHall < MIN_TOWN_HALL || townHall > MAX_TOWN_HALL) return null;
  return getTownHallReference(townHall);
}
import { ARMY_CATALOG } from '@/lib/armies';
import { META_VERSION } from '@/lib/meta';
import type {
  ArmyRecommendation,
  ReadinessTier,
  WarInput,
  WarReadiness,
  WarTierProjection,
} from './types';

const HERO_LABEL: Readonly<Record<HeroId, string>> = {
  barbarianKing: 'Barbarian King',
  archerQueen: 'Archer Queen',
  grandWarden: 'Grand Warden',
  royalChampion: 'Royal Champion',
  minionPrince: 'Minion Prince',
  dragonDuke: 'Dragon Duke',
};

/** Average hero completion (0..1) vs this Town Hall's caps. */
export function heroCompletion(input: WarInput): number {
  const ref = safeRef(input.townHall);
  if (ref === null) return 0;
  let sum = 0;
  let count = 0;
  for (const id of ALL_HERO_IDS) {
    const cap = ref.heroes[id];
    if (!cap.unlocked || cap.maxLevel <= 0) continue;
    sum += clamp((input.heroLevels[id] ?? 0) / cap.maxLevel, 0, 1);
    count += 1;
  }
  return count > 0 ? sum / count : 0;
}

function scoreArmyFit(
  army: (typeof ARMY_CATALOG)[number],
  input: WarInput,
  heroComp: number,
): ArmyRecommendation {
  const heroOk = heroComp >= army.minHeroCompletion;
  const labOk = input.labLevelPct >= army.minLabPct;
  const heroScore = clamp(heroComp / army.minHeroCompletion, 0, 1);
  const labScore = clamp(input.labLevelPct / army.minLabPct, 0, 1);
  const fit = Math.round(100 * (0.55 * heroScore + 0.45 * labScore));
  const missing: string[] = [];
  if (!heroOk) {
    const names =
      army.keyHeroes.map((h) => HERO_LABEL[h]).join(', ') || 'your heroes';
    missing.push(
      `Level ${names} (needs ~${Math.round(army.minHeroCompletion * 100)}% hero completion)`,
    );
  }
  if (!labOk) {
    missing.push(
      `Finish your lab (needs ~${army.minLabPct}% army development)`,
    );
  }
  return {
    id: army.id,
    name: army.name,
    fit,
    ready: heroOk && labOk,
    tier: army.tier,
    missing,
    why: army.why,
  };
}

/** Top meta armies the account can field for its goal, best fit first. */
export function recommendArmies(
  input: WarInput,
): readonly ArmyRecommendation[] {
  const heroComp = heroCompletion(input);
  const available = ARMY_CATALOG.filter((a) => a.minTownHall <= input.townHall);
  const forGoal = available.filter((a) => a.goals.includes(input.goal));
  const pool = forGoal.length > 0 ? forGoal : available;
  return pool
    .map((a) => scoreArmyFit(a, input, heroComp))
    .sort((a, b) => b.fit - a.fit || b.tier.localeCompare(a.tier))
    .slice(0, 5);
}

function readinessTier(score: number): ReadinessTier {
  if (score < 50) return 'Not Ready';
  if (score < 70) return 'Partially Ready';
  if (score < 88) return 'War Ready';
  return 'Elite War Ready';
}

function warTierProjection(score: number): WarTierProjection {
  if (score < 60) return 'Casual War';
  if (score < 80) return 'Competitive War';
  return 'CWL Ready';
}

/** Heroes sorted by how far they are from their TH cap (biggest gap first). */
function heroGaps(input: WarInput): { id: HeroId; gap: number }[] {
  const ref = safeRef(input.townHall);
  if (ref === null) return [];
  const gaps: { id: HeroId; gap: number }[] = [];
  for (const id of ALL_HERO_IDS) {
    const cap = ref.heroes[id];
    if (!cap.unlocked || cap.maxLevel <= 0) continue;
    const level = clamp(input.heroLevels[id] ?? 0, 0, cap.maxLevel);
    gaps.push({ id, gap: cap.maxLevel - level });
  }
  return gaps.sort((a, b) => b.gap - a.gap);
}

/** The full war-readiness assessment. Pure + deterministic. */
export function assessWarReadiness(input: WarInput): WarReadiness {
  const heroComp = heroCompletion(input);
  const recs = recommendArmies(input);
  const best = recs[0];
  const bestFit = best?.fit ?? 0;
  const score = clamp(
    Math.round(0.4 * heroComp * 100 + 0.3 * input.labLevelPct + 0.3 * bestFit),
  );
  const tier = readinessTier(score);

  const gaps = heroGaps(input);
  const upgradePriorities: string[] = gaps
    .filter((g) => g.gap > 0)
    .slice(0, 3)
    .map((g) => `Upgrade ${HERO_LABEL[g.id]} (+${g.gap} to your TH cap)`);
  if (input.labLevelPct < 85) {
    upgradePriorities.push('Finish key lab upgrades for your meta army');
  }

  const missingRequirements = best ? [...best.missing] : [];

  const gapToReady = Math.max(0, 85 - score);
  const timeToReadyDays =
    gapToReady === 0
      ? 0
      : Math.round(gapToReady * (input.townHall >= 16 ? 3 : 2));

  const explanation = best
    ? best.ready
      ? `${best.name} is recommended — your heroes and lab support it. You're ${tier.toLowerCase()}.`
      : `Work toward ${best.name}: ${best.missing.join('; ') || 'level up'}. You're ${tier.toLowerCase()}.`
    : `No meta army fits yet at TH${input.townHall} — keep developing heroes and lab.`;

  return {
    score,
    tier,
    warTier: warTierProjection(score),
    recommendedArmies: recs,
    missingRequirements,
    upgradePriorities,
    timeToReadyDays,
    explanation,
    metaVersion: META_VERSION,
  };
}
