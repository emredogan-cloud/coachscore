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

import {
  getTownHallReference,
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
  type HeroId,
} from '@/lib/game-data';
import type { ReferenceReadiness } from './types';

/**
 * The heroes whose per-Town-Hall caps DETERMINE the paid score and have a
 * documented, verifiable source. Dragon Duke (the newest, 6th hero) is excluded:
 * its per-TH caps aren't reliably documented yet, it carries the smallest hero
 * weight, and the player's DD level still comes from the live API — its cap only
 * clamps an already-real number. It stays flagged in the table but does not gate.
 */
const SCORE_GATING_HEROES: readonly HeroId[] = [
  'barbarianKing',
  'archerQueen',
  'grandWarden',
  'royalChampion',
  'minionPrince',
];

/**
 * Compute paid-readiness for a Town Hall from the reference data that actually
 * DETERMINES the score: the per-TH hero caps (the dominant dimension) plus the
 * wall max level. The "representative" offense/defense category placeholders are
 * NOT score-determining (the tag path derives offense from the live API and
 * excludes defenses/walls it can't read), so they are reported as residual debt
 * elsewhere but do not block a paid report. Pure.
 */
export function referenceDataReadiness(townHall: number): ReferenceReadiness {
  if (
    !Number.isInteger(townHall) ||
    townHall < MIN_TOWN_HALL ||
    townHall > MAX_TOWN_HALL
  ) {
    return {
      ready: false,
      unverifiedCount: 1,
      unverifiedFields: [`TH${townHall} is outside the supported range`],
    };
  }
  const row = getTownHallReference(townHall);
  const unverifiedFields: string[] = [];
  for (const id of SCORE_GATING_HEROES) {
    const cap = row.heroes[id];
    if (cap.unlocked && cap.needsVerification) {
      unverifiedFields.push(`TH${townHall} hero "${id}"`);
    }
  }
  if (row.categories.walls.needsVerification) {
    unverifiedFields.push(`TH${townHall} category "walls"`);
  }
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
