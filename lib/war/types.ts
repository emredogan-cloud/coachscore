/**
 * Attack / War Intelligence types (Feature 1 · P1-B).
 *
 * The engine answers the questions players actually pay for: what army should I
 * run, am I war-ready, what do I upgrade for attacking, and how long until I'm
 * ready. Deterministic + versioned + patch-aware; recommendations are filtered
 * to what the player can actually field (never an impossible army).
 */

import type { HeroId } from '@/lib/game-data';

export type WarGoal = 'war' | 'cwl' | 'trophy' | 'farming' | 'legends';

export type ReadinessTier =
  | 'Not Ready'
  | 'Partially Ready'
  | 'War Ready'
  | 'Elite War Ready';

export type WarTierProjection = 'Casual War' | 'Competitive War' | 'CWL Ready';

/** What the engine needs. Hero levels + a lab-development signal are enough for
 *  recommendations; granular `units` (from the official API) sharpen them. */
export interface WarInput {
  readonly townHall: number;
  readonly heroLevels: Partial<Record<HeroId, number>>;
  /** 0..100 army/lab development. Coarse is fine; the API path can compute it. */
  readonly labLevelPct: number;
  /** Optional granular unit levels keyed by in-game name (from the API). */
  readonly units?: Readonly<
    Record<string, { level: number; maxLevel: number }>
  >;
  readonly goal: WarGoal;
}

export interface ArmyRecommendation {
  readonly id: string;
  readonly name: string;
  /** 0..100 how well the army fits the account RIGHT NOW. */
  readonly fit: number;
  readonly ready: boolean;
  readonly tier: string;
  /** Unmet requirements keeping this army from being fully ready. */
  readonly missing: readonly string[];
  readonly why: string;
}

export interface WarReadiness {
  readonly score: number; // 0..100
  readonly tier: ReadinessTier;
  readonly warTier: WarTierProjection;
  readonly recommendedArmies: readonly ArmyRecommendation[];
  readonly missingRequirements: readonly string[];
  readonly upgradePriorities: readonly string[];
  readonly timeToReadyDays: number | null;
  readonly explanation: string;
  readonly metaVersion: string;
}
