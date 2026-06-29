/**
 * Score history + progress (P1-A retention spine · EMO-P1 milestones).
 *
 * Pure, storage-agnostic core: given a player's past score entries it computes
 * the progress summary (delta vs last time, personal best) and the milestones
 * worth celebrating ("first A", "new personal best", "grade up B→A", "de-rushed",
 * re-check streak). The client wrapper (components/report/score-history.tsx)
 * persists entries to localStorage today; a DB-backed, cross-device store is the
 * documented follow-up (the sandbox DB host is unreachable — see wave report).
 */

export interface ScoreEntry {
  readonly tag: string;
  readonly at: number; // epoch ms
  readonly grade: string;
  readonly overall: number;
  readonly townHall: number;
  readonly goal: string;
  readonly rushLabel?: string;
}

export interface ProgressSummary {
  readonly count: number;
  readonly latest: ScoreEntry | null;
  readonly previous: ScoreEntry | null;
  /** latest.overall − previous.overall, or null if there's no prior entry. */
  readonly overallDelta: number | null;
  readonly best: number;
  readonly isBest: boolean;
  readonly milestones: readonly string[];
}

const GRADE_ORDER = ['F', 'D', 'C', 'B', 'A', 'S'] as const;

function gradeRank(grade: string): number {
  const i = GRADE_ORDER.indexOf(grade as (typeof GRADE_ORDER)[number]);
  return i < 0 ? 0 : i;
}

/** Chronological sort (oldest → newest), defensive copy. */
function chronological(history: readonly ScoreEntry[]): ScoreEntry[] {
  return [...history].sort((a, b) => a.at - b.at);
}

/** Milestones earned by the latest entry vs the prior history. Pure. */
export function detectMilestones(
  history: readonly ScoreEntry[],
): readonly string[] {
  const sorted = chronological(history);
  const latest = sorted[sorted.length - 1];
  if (!latest) return [];
  const prior = sorted.slice(0, -1);
  const out: string[] = [];

  const priorBest = prior.reduce((m, e) => Math.max(m, e.overall), 0);
  if (prior.length > 0 && latest.overall > priorBest) {
    out.push('New personal best');
  }
  const prev = prior[prior.length - 1];
  if (prev && gradeRank(latest.grade) > gradeRank(prev.grade)) {
    out.push(`Grade up: ${prev.grade} → ${latest.grade}`);
  }
  if (
    (latest.grade === 'A' || latest.grade === 'S') &&
    !prior.some((e) => e.grade === 'A' || e.grade === 'S')
  ) {
    out.push(`First ${latest.grade}!`);
  }
  if (
    latest.rushLabel === 'Well-Developed' &&
    prior.some((e) => e.rushLabel && e.rushLabel !== 'Well-Developed')
  ) {
    out.push('De-rushed');
  }
  if (sorted.length >= 3) out.push(`${sorted.length} check-ins`);
  return out;
}

/** Summarize a player's progress from their score history. Pure. */
export function summarizeProgress(
  history: readonly ScoreEntry[],
): ProgressSummary {
  const sorted = chronological(history);
  const latest = sorted[sorted.length - 1] ?? null;
  const previous =
    sorted.length >= 2 ? (sorted[sorted.length - 2] ?? null) : null;
  const best = sorted.reduce((m, e) => Math.max(m, e.overall), 0);
  return {
    count: sorted.length,
    latest,
    previous,
    overallDelta: latest && previous ? latest.overall - previous.overall : null,
    best,
    isBest: latest !== null && latest.overall >= best,
    milestones: detectMilestones(sorted),
  };
}
