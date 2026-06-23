/**
 * Intake confidence + completeness (Phase 3).
 *
 * Manual entry starts fully confident and is docked for each expected-but-
 * missing field (so the wizard can prompt to confirm). Screenshot extraction
 * derives confidence from the OCR per-field confidences, surfacing the
 * low-confidence keys the user must verify before a paid report.
 */

import { clamp } from '@/lib/core';
import type { ExtractedField } from '@/lib/ai';
import {
  ALL_HERO_IDS,
  getTownHallReference,
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
} from '@/lib/game-data';
import type { IntakeFields } from './types';

export interface IntakeConfidence {
  readonly score: number;
  readonly fieldsNeedingConfirmation: string[];
}

/** Expected-but-missing fields for the account's Town Hall. */
export function assessCompleteness(fields: IntakeFields): string[] {
  // Out-of-range Town Halls are rejected by the result builder; completeness is
  // undefined there, so stay total (never throw) and report nothing missing.
  if (fields.townHall < MIN_TOWN_HALL || fields.townHall > MAX_TOWN_HALL) {
    return [];
  }
  const missing: string[] = [];
  const ref = getTownHallReference(fields.townHall);
  for (const id of ALL_HERO_IDS) {
    if (ref.heroes[id].unlocked && fields.heroLevels[id] === undefined) {
      missing.push(`hero:${id}`);
    }
  }
  if (fields.walls.total <= 0) missing.push('walls');
  if (ref.equipment.available && fields.equipment === undefined) {
    missing.push('equipment');
  }
  return missing;
}

/** Confidence for manually entered data: 1.0 minus 0.1 per missing field. */
export function manualConfidence(fields: IntakeFields): IntakeConfidence {
  const missing = assessCompleteness(fields);
  const score = Math.max(0.4, 1 - 0.1 * missing.length);
  return { score, fieldsNeedingConfirmation: missing };
}

/** Confidence for OCR-extracted data: mean field confidence + low-conf keys. */
export function extractionConfidence(
  fields: readonly ExtractedField[],
): IntakeConfidence {
  if (fields.length === 0) {
    return { score: 0, fieldsNeedingConfirmation: [] };
  }
  const mean = fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;
  const low = fields.filter((f) => f.needsConfirmation).map((f) => f.key);
  return { score: clamp(mean, 0, 1), fieldsNeedingConfirmation: low };
}
