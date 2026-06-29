/**
 * Types for the CoachScore scoring engine.
 *
 * The engine is pure and deterministic (ADR 0003): its output is a function of
 * the inputs here and nothing else (no clock, no randomness, no I/O). Reference
 * maxima/weights are baked into the normalized inputs by an upstream adapter, so
 * the engine never reaches into the game-data table itself.
 */

import type { Grade } from './grade';

/** The user-selected goal that drives the weight profile (deep-dive §7.4). */
export type Goal =
  | 'progress'
  | 'war'
  | 'trophy'
  | 'derush'
  | 'recruit'
  | 'rate';

export const ALL_GOALS: readonly Goal[] = [
  'progress',
  'war',
  'trophy',
  'derush',
  'recruit',
  'rate',
] as const;

/** The seven scored dimensions (deep-dive §7.2). */
export type SubScoreKey =
  | 'heroes'
  | 'offense'
  | 'defense'
  | 'equipment'
  | 'progression'
  | 'walls'
  | 'clanValue';

/** A leveled element scored by its completion ratio, weighted by cost/time. */
export interface WeightedElement {
  readonly id: string;
  readonly level: number;
  readonly maxLevel: number;
  /** Cost/time weight (e.g. DE cost for heroes, lab time for troops). */
  readonly weight: number;
}

/** A hero: completion weighted by Dark-Elixir cost-to-max (deep-dive §7.2(1)). */
export interface HeroInput {
  readonly id: string;
  readonly level: number;
  readonly maxLevel: number;
  readonly deCostWeight: number;
}

/** Hero Equipment inputs; N/A below TH16 (deep-dive §7.2(4)). */
export interface EquipmentInput {
  readonly available: boolean;
  readonly keyEpicsUnlocked: number;
  readonly keyEpicsTotal: number;
  readonly levelSum: number;
  readonly maxLevelSum: number;
}

/** Walls: segments at/above the TH max over total (deep-dive §7.2(6)). */
export interface WallsInput {
  readonly atOrAboveThMax: number;
  readonly total: number;
}

/** Clan Value behavioral inputs, each normalized to [0, 1] (deep-dive §7.2(7)). */
export interface ClanInput {
  readonly donationBehavior: number;
  readonly warContribution: number;
  readonly capitalContribution: number;
  readonly activitySignal: number;
}

/**
 * A fully normalized account, ready to score. Offense/defense/progression are
 * lists of weighted elements; progression elements are expressed against the
 * PREVIOUS Town Hall's caps (deep-dive §7.2(5)).
 */
export interface NormalizedAccount {
  readonly townHall: number;
  readonly heroes: readonly HeroInput[];
  readonly offense: readonly WeightedElement[];
  readonly defense: readonly WeightedElement[];
  readonly walls: WallsInput;
  readonly equipment: EquipmentInput;
  readonly clan: ClanInput;
  readonly progression: readonly WeightedElement[];
}

/** The seven sub-scores. Equipment is `null` when N/A (TH < 16). */
export interface SubScores {
  readonly heroes: number;
  readonly offense: number;
  /** `null` when not observable (e.g. the official API can't read defenses). */
  readonly defense: number | null;
  readonly equipment: number | null;
  readonly progression: number;
  /** `null` when not observable (e.g. the official API can't read walls). */
  readonly walls: number | null;
  readonly clanValue: number;
}

export type RushLabel =
  | 'Well-Developed'
  | 'Lightly Rushed'
  | 'Moderately Rushed'
  | 'Heavily Rushed';

/** One actionable gap that seeds the roadmap (deep-dive §7.5). */
export interface GapItem {
  readonly id: string;
  readonly category: SubScoreKey;
  readonly level: number;
  readonly maxLevel: number;
  readonly completion: number;
  readonly underCompletion: number;
  /** Goal-relevant impact (the category's profile weight). */
  readonly impact: number;
  readonly cost: number;
  /** impact × under-completion ÷ cost (deep-dive §7.5). */
  readonly priority: number;
}

export interface CoachScoreResult {
  readonly townHall: number;
  readonly goal: Goal;
  readonly subScores: SubScores;
  readonly rushLabel: RushLabel;
  /** Precise composite in [0, 100]. */
  readonly overall: number;
  /** Composite rounded to an integer (drives the grade + display). */
  readonly overallRounded: number;
  readonly grade: Grade;
  /** Gaps sorted by priority, descending. */
  readonly gaps: readonly GapItem[];
  readonly engineVersion: string;
}

export const ENGINE_VERSION = '1.0.0';
