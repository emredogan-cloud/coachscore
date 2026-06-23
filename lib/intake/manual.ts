/**
 * Manual intake path (Phase 3).
 *
 * The always-available fallback: the user types their levels. Validation +
 * normalization run with no external dependency, so manual intake works today
 * without any credential — only persistence of the result awaits the database.
 */

import { manualConfidence } from './confidence';
import { buildIntakeResult } from './result';
import type { IntakeRequest, IntakeResult } from './types';

export function intakeManual(request: IntakeRequest): IntakeResult {
  const { score, fieldsNeedingConfirmation } = manualConfidence(request.fields);
  return buildIntakeResult('manual', request.fields, request.goal, {
    confidence: score,
    fieldsNeedingConfirmation,
    note: 'manual entry',
  });
}
