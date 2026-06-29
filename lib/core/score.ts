/**
 * The composite CoachScore (deep-dive §7.3) — the engine's public entry point.
 *
 * Pure + deterministic (ADR 0003): `computeCoachScore` is a function of
 * (account, goal) only. The composite is a weighted average of the sub-scores
 * under the goal's active profile; sub-scores that are N/A (Equipment below
 * TH16) are dropped and the remaining weights renormalized, which is how the
 * Equipment weight is "redistributed" for low Town Halls.
 */

import { toGrade } from './grade';
import { buildGapList } from './gaps';
import {
  clanValueScore,
  clamp,
  equipmentScore,
  heroScore,
  progressionScore,
  rushLabel,
  wallScore,
  weightedCompletionScore,
} from './subscores';
import { ENGINE_VERSION } from './types';
import type {
  CoachScoreResult,
  Goal,
  NormalizedAccount,
  SubScoreKey,
  SubScores,
} from './types';
import { selectWeightProfile } from './weights';
import type { WeightProfile } from './weights';

const SUBSCORE_KEYS: readonly SubScoreKey[] = [
  'heroes',
  'offense',
  'defense',
  'equipment',
  'progression',
  'walls',
  'clanValue',
];

/**
 * Compute the seven sub-scores for a normalized account.
 *
 * Defense and Walls are returned as `null` when the source could not observe
 * them (no defense elements / zero total walls) — "unknown" is not "zero". This
 * lets the composite drop and renormalize them, so a tag-only account (the
 * official API exposes progression but NOT defenses or walls) is scored
 * honestly over the dimensions we can actually read, instead of being dragged
 * down by phantom zeros. A real, fully-observed account always carries them.
 */
export function computeSubScores(account: NormalizedAccount): SubScores {
  return {
    heroes: heroScore(account.heroes),
    offense: weightedCompletionScore(account.offense),
    defense:
      account.defense.length > 0
        ? weightedCompletionScore(account.defense)
        : null,
    equipment: equipmentScore(account.equipment),
    progression: progressionScore(account.progression),
    walls: account.walls.total > 0 ? wallScore(account.walls) : null,
    clanValue: clanValueScore(account.clan),
  };
}

/**
 * Composite = Σ(weightₖ · subScoreₖ) / Σ(weightₖ) over sub-scores that are
 * present (non-null) and carry positive weight. The renormalization handles
 * N/A Equipment cleanly. Returns 0 when no weighted sub-score is available.
 */
export function composite(
  subScores: SubScores,
  profile: WeightProfile,
): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const key of SUBSCORE_KEYS) {
    const weight = profile[key];
    const value = subScores[key];
    if (weight > 0 && value !== null) {
      weightedSum += weight * value;
      weightTotal += weight;
    }
  }
  if (weightTotal <= 0) return 0;
  return clamp(weightedSum / weightTotal);
}

/**
 * Compute the full CoachScore result for an account under a goal. This is the
 * single deterministic entry point used by the report pipeline.
 *
 * @throws RangeError if the Town Hall is not a positive integer.
 */
export function computeCoachScore(
  account: NormalizedAccount,
  goal: Goal,
): CoachScoreResult {
  if (!Number.isInteger(account.townHall) || account.townHall <= 0) {
    throw new RangeError(
      `townHall must be a positive integer; received ${account.townHall}`,
    );
  }

  const profile = selectWeightProfile(goal, account.townHall);
  const subScores = computeSubScores(account);
  const overall = composite(subScores, profile);
  const overallRounded = Math.round(overall);

  return {
    townHall: account.townHall,
    goal,
    subScores,
    rushLabel: rushLabel(subScores.progression),
    overall,
    overallRounded,
    grade: toGrade(overallRounded),
    gaps: buildGapList(account, profile),
    engineVersion: ENGINE_VERSION,
  };
}
