/**
 * "You vs a maxed base" benchmark (HR-4 — beat human reviewers on comparison).
 *
 * A human reviewer can't instantly tell you exactly how far you are from a maxed
 * base for your Town Hall — software can, objectively, with no user corpus: every
 * sub-score is already completion-vs-maxed-for-your-TH, so the gap to 100 IS the
 * distance to a maxed base. (A future, corpus-based "vs other players" percentile
 * is HR-4's second half — it compounds with traffic.) Pure + testable.
 */

import type { SubScores } from '@/lib/core';

export interface DimensionGap {
  readonly key: string;
  readonly label: string;
  readonly you: number;
  readonly gap: number;
}

export interface MaxedBenchmark {
  readonly townHall: number;
  readonly overall: number;
  readonly overallGap: number;
  readonly biggest: DimensionGap | null;
  readonly gaps: readonly DimensionGap[];
  readonly headline: string;
}

const LABELS: Readonly<Record<string, string>> = {
  heroes: 'Heroes',
  offense: 'Offense',
  defense: 'Defense',
  equipment: 'Equipment',
  progression: 'Progression',
  walls: 'Walls',
  clanValue: 'Clan value',
};

/** Compare a scored account to a maxed base for its Town Hall. Pure. */
export function benchmarkVsMaxed(
  subScores: SubScores,
  overall: number,
  townHall: number,
): MaxedBenchmark {
  const gaps: DimensionGap[] = [];
  for (const [key, value] of Object.entries(subScores)) {
    if (value === null) continue; // not observable (e.g. tag-path defense/walls)
    gaps.push({
      key,
      label: LABELS[key] ?? key,
      you: Math.round(value),
      gap: Math.round(100 - value),
    });
  }
  gaps.sort((a, b) => b.gap - a.gap);
  const overallRounded = Math.round(overall);
  return {
    townHall,
    overall: overallRounded,
    overallGap: 100 - overallRounded,
    biggest: gaps[0] ?? null,
    gaps,
    headline: `You're ${overallRounded}% of a maxed TH${townHall} base.`,
  };
}
