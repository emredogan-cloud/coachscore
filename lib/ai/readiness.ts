/**
 * Reference-data readiness gate.
 *
 * Per the build's REFERENCE DATA REQUIREMENT, best-effort (`needsVerification`)
 * reference values must be explicitly ISOLATED from paid report generation
 * until verified against live game data. This gate reports, per Town Hall,
 * whether the underlying reference data is fully verified.
 *
 * The paid path (Phase 4 checkout) MUST require `ready === true`. Free/teaser
 * and human-reviewed drafts may proceed with `ready === false` but are clearly
 * flagged as using unverified data. See FINAL_EXECUTION_REPORT / docs.
 */

import { validateReferenceTable } from '@/lib/game-data';
import type { ReferenceReadiness } from './types';

/**
 * Compute readiness for a Town Hall by filtering the reference table's
 * verification debt to that TH. Pure.
 */
export function referenceDataReadiness(townHall: number): ReferenceReadiness {
  const { verificationDebt } = validateReferenceTable();
  const prefix = `TH${townHall} `;
  const unverifiedFields = verificationDebt.filter((d) => d.startsWith(prefix));
  return {
    ready: unverifiedFields.length === 0,
    unverifiedCount: unverifiedFields.length,
    unverifiedFields,
  };
}

/**
 * Guard for the paid path: throws if the Town Hall's reference data is not
 * fully verified. Phase 4 calls this before generating a PAID report.
 */
export function assertPaidReportAllowed(townHall: number): void {
  const readiness = referenceDataReadiness(townHall);
  if (!readiness.ready) {
    throw new Error(
      `Paid report blocked for TH${townHall}: ${readiness.unverifiedCount} ` +
        `reference field(s) need verification. Verify them against live game ` +
        `data or exclude this TH from paid generation. Fields: ` +
        readiness.unverifiedFields.join(', '),
    );
  }
}
