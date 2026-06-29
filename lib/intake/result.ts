/**
 * Shared intake-result builder (Phase 3).
 *
 * Centralizes the path-agnostic tail of every intake: range-check the Town
 * Hall, normalize to a `NormalizedAccount`, capture an immutable version-locked
 * snapshot, and attach reference-data readiness (the paid-report gate). Pure.
 */

import type { Goal } from '@/lib/core';
import { referenceDataReadiness } from '@/lib/ai';
import { MAX_TOWN_HALL, MIN_TOWN_HALL } from '@/lib/game-data';
import { createSnapshot } from '@/lib/snapshot';
import type { IntakeSource } from '@/lib/snapshot';
import { normalizeIntake } from './normalize';
import type { IntakeFields, IntakeResult } from './types';

export interface BuildResultOptions {
  readonly confidence?: number;
  readonly fieldsNeedingConfirmation?: readonly string[];
  readonly note?: string;
}

/** Build a failed result with no snapshot. */
export function failedResult(
  source: IntakeSource,
  errors: readonly string[],
  notActivated = false,
): IntakeResult {
  return {
    ok: false,
    source,
    account: null,
    snapshot: null,
    confidence: 0,
    fieldsNeedingConfirmation: [],
    referenceReady: false,
    notActivated,
    errors,
  };
}

/** Normalize + snapshot captured fields into a successful intake result. */
export function buildIntakeResult(
  source: IntakeSource,
  fields: IntakeFields,
  goal: Goal,
  options: BuildResultOptions = {},
): IntakeResult {
  if (
    !Number.isInteger(fields.townHall) ||
    fields.townHall < MIN_TOWN_HALL ||
    fields.townHall > MAX_TOWN_HALL
  ) {
    return failedResult(source, [
      `Town Hall ${fields.townHall} is outside the supported range ` +
        `${MIN_TOWN_HALL}–${MAX_TOWN_HALL}.`,
    ]);
  }

  const account = normalizeIntake(fields);
  const readiness = referenceDataReadiness(fields.townHall);
  const confidence = options.confidence ?? 1;
  // Dimensions the source couldn't observe (e.g. defenses/walls over the tag
  // API) are surfaced as "needs confirmation" so the UI can prompt for a
  // screenshot to complete them. Deduped with any explicitly-passed fields.
  const fieldsNeedingConfirmation = [
    ...new Set([
      ...(options.fieldsNeedingConfirmation ?? []),
      ...(fields.unknownDimensions ?? []),
    ]),
  ];

  const snapshot = createSnapshot({
    account,
    goal,
    provenance: {
      source,
      confidence,
      fieldsNeedingConfirmation,
      note: options.note,
    },
  });

  return {
    ok: true,
    source,
    account,
    snapshot,
    confidence,
    fieldsNeedingConfirmation,
    referenceReady: readiness.ready,
    notActivated: false,
    errors: [],
  };
}
