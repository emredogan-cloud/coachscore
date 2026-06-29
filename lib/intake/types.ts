/**
 * Intake domain types (Phase 3).
 *
 * All three intake paths (tag / screenshot / manual) converge on `IntakeFields`
 * — the raw, source-agnostic shape — which `normalizeIntake` turns into the
 * engine's `NormalizedAccount` using the Game-Data Reference Table for caps and
 * weights. Every path then produces an `IntakeResult` carrying an immutable,
 * version-locked snapshot ready for scoring.
 */

import type { Goal, NormalizedAccount } from '@/lib/core';
import type { HeroId } from '@/lib/game-data';
import type { AccountSnapshot, IntakeSource } from '@/lib/snapshot';

/** Clan behavioral signals, each normalized to [0, 1]. */
export interface ClanSignals {
  readonly donationBehavior: number;
  readonly warContribution: number;
  readonly capitalContribution: number;
  readonly activitySignal: number;
}

/** Hero Equipment inputs (TH16+); `keyEpicsTotal` comes from the reference. */
export interface EquipmentFields {
  readonly keyEpicsUnlocked: number;
  readonly levelSum: number;
  readonly maxLevelSum: number;
}

/**
 * Source-agnostic captured fields. Offense/Defense/Progression are expressed as
 * 0..100 representative completion (intuitive for users and matches the engine's
 * weighted-completion model); hero levels + equipment totals are reconciled
 * against the reference table during normalization.
 */
export interface IntakeFields {
  readonly townHall: number;
  /** Current level per hero; only heroes unlocked at this TH are scored. */
  readonly heroLevels: Partial<Record<HeroId, number>>;
  /** 0..100 representative completion of the meta army. */
  readonly offensePercent: number;
  /** 0..100 representative completion of key defenses. */
  readonly defensePercent: number;
  /** 0..100 completion vs the PREVIOUS Town Hall (rush diagnostic). */
  readonly progressionPercent: number;
  readonly walls: { readonly atOrAboveThMax: number; readonly total: number };
  /** Equipment inputs (TH16+); ignored below TH16. */
  readonly equipment?: EquipmentFields;
  readonly clan: ClanSignals;
  /**
   * Dimensions the source could not observe (e.g. the official Clash of Clans
   * API exposes progression but NOT defenses or walls). Listed dimensions are
   * normalized to "absent" so the engine drops them and renormalizes, instead
   * of scoring an unknown as zero. Omitted/empty = everything was observed.
   */
  readonly unknownDimensions?: readonly ('defense' | 'walls')[];
}

export interface IntakeRequest {
  readonly goal: Goal;
  readonly fields: IntakeFields;
}

/** The uniform result of any intake path. */
export interface IntakeResult {
  readonly ok: boolean;
  readonly source: IntakeSource;
  readonly account: NormalizedAccount | null;
  readonly snapshot: AccountSnapshot | null;
  /** 0..1 confidence in the captured data. */
  readonly confidence: number;
  /** Field keys still needing user confirmation (low-confidence OCR, gaps). */
  readonly fieldsNeedingConfirmation: readonly string[];
  /** Whether the reference data backing this TH is fully verified (paid gate). */
  readonly referenceReady: boolean;
  /** Whether the path could not run because a credential is absent (gated). */
  readonly notActivated: boolean;
  readonly errors: readonly string[];
}
