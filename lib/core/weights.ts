/**
 * Goal-aware weight profiles (deep-dive §7.3–§7.4).
 *
 * Each profile is a full set of sub-score weights that sums to 1.0. We define
 * BOTH a `below16` variant (Equipment N/A → weight 0, redistributed across the
 * others) and a `th16plus` variant (Equipment in play) explicitly, rather than
 * deriving one from the other, so the values are auditable and match the
 * worked examples in the source exactly.
 *
 * Anchored values:
 *   - progress / th16plus = the default profile in §7.3
 *     (Heroes .22, Progression .20, Offense .18, Defense .18, Equipment .12,
 *      Walls .05, Clan .05)
 *   - war / below16 = the §7.7 worked example
 *     (Heroes .28, Offense .24, Defense .18, Progression .18, Walls .06, Clan .06)
 * Other profiles follow the up/down-weight directions in the §7.4 table and are
 * each verified to sum to 1.0 by a property test.
 */

import type { Goal, SubScoreKey } from './types';

export type WeightProfile = Readonly<Record<SubScoreKey, number>>;

interface GoalProfiles {
  readonly below16: WeightProfile;
  readonly th16plus: WeightProfile;
}

const progress: GoalProfiles = {
  below16: {
    heroes: 0.25,
    progression: 0.23,
    offense: 0.205,
    defense: 0.205,
    equipment: 0,
    walls: 0.055,
    clanValue: 0.055,
  },
  th16plus: {
    heroes: 0.22,
    progression: 0.2,
    offense: 0.18,
    defense: 0.18,
    equipment: 0.12,
    walls: 0.05,
    clanValue: 0.05,
  },
};

const war: GoalProfiles = {
  // EXACT match to the deep-dive §7.7 worked example (TH14, war goal).
  below16: {
    heroes: 0.28,
    offense: 0.24,
    defense: 0.18,
    progression: 0.18,
    equipment: 0,
    walls: 0.06,
    clanValue: 0.06,
  },
  th16plus: {
    heroes: 0.24,
    offense: 0.22,
    equipment: 0.16,
    defense: 0.16,
    progression: 0.14,
    walls: 0.04,
    clanValue: 0.04,
  },
};

const trophy: GoalProfiles = {
  below16: {
    defense: 0.27,
    heroes: 0.25,
    offense: 0.17,
    progression: 0.17,
    equipment: 0,
    walls: 0.08,
    clanValue: 0.06,
  },
  th16plus: {
    defense: 0.24,
    heroes: 0.22,
    equipment: 0.16,
    offense: 0.14,
    progression: 0.14,
    walls: 0.06,
    clanValue: 0.04,
  },
};

const derush: GoalProfiles = {
  below16: {
    progression: 0.32,
    defense: 0.22,
    walls: 0.16,
    heroes: 0.15,
    offense: 0.12,
    equipment: 0,
    clanValue: 0.03,
  },
  th16plus: {
    progression: 0.28,
    defense: 0.2,
    walls: 0.14,
    heroes: 0.14,
    offense: 0.12,
    equipment: 0.08,
    clanValue: 0.04,
  },
};

const recruit: GoalProfiles = {
  below16: {
    clanValue: 0.27,
    heroes: 0.25,
    offense: 0.23,
    defense: 0.15,
    progression: 0.07,
    equipment: 0,
    walls: 0.03,
  },
  th16plus: {
    clanValue: 0.24,
    heroes: 0.22,
    offense: 0.2,
    defense: 0.14,
    equipment: 0.12,
    progression: 0.06,
    walls: 0.02,
  },
};

/** "Just rate me" uses the balanced default profile. */
const rate: GoalProfiles = progress;

export const WEIGHT_PROFILES: Readonly<Record<Goal, GoalProfiles>> = {
  progress,
  war,
  trophy,
  derush,
  recruit,
  rate,
};

/** Town Hall at/above which Hero Equipment is scored (deep-dive §7.2(4)). */
export const EQUIPMENT_MIN_TOWN_HALL = 16;

/** Select the active weight profile for a goal + Town Hall. */
export function selectWeightProfile(
  goal: Goal,
  townHall: number,
): WeightProfile {
  const profiles = WEIGHT_PROFILES[goal];
  return townHall >= EQUIPMENT_MIN_TOWN_HALL
    ? profiles.th16plus
    : profiles.below16;
}
