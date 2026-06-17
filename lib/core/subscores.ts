/**
 * The seven CoachScore sub-scores (deep-dive §7.2).
 *
 * Every function is pure and clamps its output to [0, 100]. Division guards
 * return 0 for empty inputs rather than NaN, so a partial account never crashes
 * the engine.
 */

import type {
  ClanInput,
  EquipmentInput,
  HeroInput,
  RushLabel,
  WallsInput,
  WeightedElement,
} from './types';

/** Clamp a number into [min, max]. */
export function clamp(value: number, min = 0, max = 100): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** completion_i = level / maxLevel, clamped to [0, 1]; 0 when maxLevel <= 0. */
export function completion(level: number, maxLevel: number): number {
  if (maxLevel <= 0) return 0;
  return clamp(level / maxLevel, 0, 1);
}

/**
 * Weighted-completion score over a set of elements:
 * 100 × Σ(wᵢ · completionᵢ) / Σ(wᵢ). Returns 0 if there is no positive weight.
 * Used for Offense (lab-time weight), Defense (cost weight), and Progression.
 */
export function weightedCompletionScore(
  elements: readonly WeightedElement[],
): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const el of elements) {
    const w = Math.max(0, el.weight);
    weightedSum += w * completion(el.level, el.maxLevel);
    weightTotal += w;
  }
  if (weightTotal <= 0) return 0;
  return clamp(100 * (weightedSum / weightTotal));
}

/**
 * Hero Score — DE-cost-weighted completion across unlocked heroes
 * (deep-dive §7.2(1)). Heroes with maxLevel <= 0 (not unlocked) are excluded.
 */
export function heroScore(heroes: readonly HeroInput[]): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const hero of heroes) {
    if (hero.maxLevel <= 0) continue;
    const w = Math.max(0, hero.deCostWeight);
    weightedSum += w * completion(hero.level, hero.maxLevel);
    weightTotal += w;
  }
  if (weightTotal <= 0) return 0;
  return clamp(100 * (weightedSum / weightTotal));
}

/**
 * Equipment Score (deep-dive §7.2(4)):
 *   100 × [0.5 × (keyEpicsUnlocked / keyEpicsTotal) + 0.5 × (levelSum / maxLevelSum)]
 * Returns `null` when equipment is N/A (TH < 16), so the composite can drop and
 * renormalize its weight.
 */
export function equipmentScore(equipment: EquipmentInput): number | null {
  if (!equipment.available) return null;
  const epicsRatio =
    equipment.keyEpicsTotal > 0
      ? clamp(equipment.keyEpicsUnlocked / equipment.keyEpicsTotal, 0, 1)
      : 0;
  const levelRatio =
    equipment.maxLevelSum > 0
      ? clamp(equipment.levelSum / equipment.maxLevelSum, 0, 1)
      : 0;
  return clamp(100 * (0.5 * epicsRatio + 0.5 * levelRatio));
}

/** Wall Score — segments at/above the TH max over total (deep-dive §7.2(6)). */
export function wallScore(walls: WallsInput): number {
  if (walls.total <= 0) return 0;
  return clamp(100 * clamp(walls.atOrAboveThMax / walls.total, 0, 1));
}

/**
 * Clan Value Score (deep-dive §7.2(7)):
 *   100 × (0.30·donation + 0.30·war + 0.20·capital + 0.20·activity)
 * Each input is expected in [0, 1] and is clamped defensively.
 */
export function clanValueScore(clan: ClanInput): number {
  const donation = clamp(clan.donationBehavior, 0, 1);
  const war = clamp(clan.warContribution, 0, 1);
  const capital = clamp(clan.capitalContribution, 0, 1);
  const activity = clamp(clan.activitySignal, 0, 1);
  return clamp(
    100 * (0.3 * donation + 0.3 * war + 0.2 * capital + 0.2 * activity),
  );
}

/**
 * Progression / Rush Score — weighted completion vs. the PREVIOUS Town Hall's
 * caps (deep-dive §7.2(5)). Elements are pre-expressed against TH(N-1) maxima.
 */
export function progressionScore(
  progression: readonly WeightedElement[],
): number {
  return weightedCompletionScore(progression);
}

/** Map a Progression/Rush score to its categorical label (deep-dive §7.2(5)). */
export function rushLabel(progression: number): RushLabel {
  if (progression >= 95) return 'Well-Developed';
  if (progression >= 80) return 'Lightly Rushed';
  if (progression >= 60) return 'Moderately Rushed';
  return 'Heavily Rushed';
}
