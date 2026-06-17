/**
 * CoachScore letter grades.
 *
 * The grade scale is fixed by the product spec (COACHSCORE_DEEP_DIVE_REPORT.md
 * §7.3): S (90+), A (80–89), B (70–79), C (60–69), D (50–59), F (<50).
 *
 * This module is pure and dependency-free; it is shared by the scoring engine
 * (Phase 1), the report renderer, and the landing page.
 */

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeBand {
  readonly grade: Grade;
  readonly min: number;
  readonly max: number;
}

/** Grade bands ordered from highest to lowest. `max` is inclusive. */
export const GRADE_BANDS: readonly GradeBand[] = [
  { grade: 'S', min: 90, max: 100 },
  { grade: 'A', min: 80, max: 89 },
  { grade: 'B', min: 70, max: 79 },
  { grade: 'C', min: 60, max: 69 },
  { grade: 'D', min: 50, max: 59 },
  { grade: 'F', min: 0, max: 49 },
] as const;

/**
 * Map a 0–100 overall score to its letter grade.
 *
 * @throws RangeError if the score is outside [0, 100] or not finite — the
 *   scoring engine guarantees in-range input, so this only fires on a bug.
 */
export function toGrade(score: number): Grade {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(
      `Score must be a finite number in [0, 100]; received ${score}`,
    );
  }
  for (const band of GRADE_BANDS) {
    if (score >= band.min) {
      return band.grade;
    }
  }
  // Unreachable: F covers [0, 49] and the loop visits it last.
  /* istanbul ignore next */
  return 'F';
}
