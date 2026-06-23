/**
 * Report assembly (Phase 4) — the deterministic core of the report experience.
 *
 * Builds a `RenderableReport` from a snapshot + engine result. An AI draft (when
 * present, already verified against the gap list in Phase 2) supplies the
 * diagnosis prose, roadmap rationales, and tips; without it, a deterministic
 * fallback is generated from the computed scores + gaps. Either way the numbers
 * come only from the engine — never invented here.
 */

import { referenceDataReadiness } from '@/lib/ai';
import type { ImpactLevel, ReportDraft } from '@/lib/ai';
import type { CoachScoreResult, GapItem, Goal, SubScoreKey } from '@/lib/core';
import type { AccountSnapshot } from '@/lib/snapshot';
import {
  deriveStrengths,
  deriveWeaknesses,
  toSubScoreViews,
} from './strengths';
import type { RenderableReport, ReportRoadmapStep } from './types';
import { buildReportVersion } from './version';

const MAX_ROADMAP = 8;

function impactForRank(rank: number): ImpactLevel {
  if (rank <= 2) return 'high';
  if (rank <= 4) return 'medium';
  return 'low';
}

function deterministicRoadmap(gaps: readonly GapItem[]): ReportRoadmapStep[] {
  return gaps.slice(0, MAX_ROADMAP).map((gap, i) => ({
    rank: i + 1,
    elementId: gap.id,
    category: gap.category,
    fromLevel: gap.level,
    toLevel: gap.maxLevel,
    rationale:
      `Bring ${gap.id} from ${gap.level} to ${gap.maxLevel}. It ranks high on ` +
      `goal-relevant impact per unit of resource/time, so it moves your score ` +
      `efficiently for this goal.`,
    estimatedImpact: impactForRank(i + 1),
  }));
}

function draftRoadmap(
  draft: ReportDraft,
  gaps: readonly GapItem[],
): ReportRoadmapStep[] {
  const categoryById = new Map<string, SubScoreKey>(
    gaps.map((g) => [g.id, g.category]),
  );
  return draft.roadmap.map((item) => ({
    rank: item.rank,
    elementId: item.elementId,
    category: categoryById.get(item.elementId) ?? 'heroes',
    fromLevel: item.fromLevel,
    toLevel: item.toLevel,
    rationale: item.rationale,
    estimatedImpact: item.estimatedImpact,
  }));
}

function deterministicDiagnosis(
  score: CoachScoreResult,
  weaknessLabel: string | undefined,
): string {
  const base =
    `Your Town Hall ${score.townHall} account scores ${score.overallRounded}/100 ` +
    `(grade ${score.grade}) for the "${score.goal}" goal and reads as ` +
    `${score.rushLabel}.`;
  const focus =
    weaknessLabel === undefined
      ? ' Your account is well-rounded, with no single dominant weakness for this goal.'
      : ` The biggest opportunity is ${weaknessLabel}: closing that gap will move ` +
        `your score the most for this goal.`;
  return base + focus;
}

const GOAL_TIPS: Readonly<Record<Goal, readonly string[]>> = {
  war: [
    'Prioritize hero levels and the meta war army before niche troops.',
    'Grand Warden ability and Royal Champion often convert two-stars into three-stars.',
    'Defer walls until heroes and army are done unless you are de-rushing.',
  ],
  trophy: [
    'Defenses and hero defensive value matter more for trophy/legend pushing.',
    'Keep a reliable defensive base layout for your league.',
    'Balance offense so you can reliably take your attacks.',
  ],
  derush: [
    'Close progression gaps against your previous Town Hall first.',
    'Lift the lowest-completion core upgrades before starting new ones.',
    'Walls and heroes are the usual rush culprits — address them in priority order.',
  ],
  recruit: [
    'Strong clan-value behavior (donations, war, capital) makes you recruitable.',
    'Show consistent activity and war participation.',
    'A clean, non-rushed account signals reliability to good clans.',
  ],
  progress: [
    'Follow the prioritized roadmap top-down — it maximizes return per resource.',
    'Max the upgrades you actually use before niche ones.',
    'Keep heroes leveling continuously; they are the biggest lever.',
  ],
  rate: [
    'Follow the prioritized roadmap top-down for the fastest score gains.',
    'Heroes and equipment (TH16+) are usually the highest-ROI investments.',
    'Avoid spreading resources thin across low-impact upgrades.',
  ],
};

function deterministicTips(goal: Goal): string[] {
  return [...GOAL_TIPS[goal]];
}

export interface AssembleReportInput {
  readonly snapshot: AccountSnapshot;
  readonly score: CoachScoreResult;
  /** Optional AI draft (verified against the gap list upstream). */
  readonly draft?: ReportDraft | null;
  readonly confidence?: number;
  readonly needsHumanReview?: boolean;
}

export function assembleReport(input: AssembleReportInput): RenderableReport {
  const { snapshot, score } = input;
  const draft = input.draft ?? null;
  const readiness = referenceDataReadiness(score.townHall);
  const weaknesses = deriveWeaknesses(score.subScores);
  const topWeakness = weaknesses[0];

  return {
    version: buildReportVersion(snapshot),
    townHall: score.townHall,
    goal: score.goal,
    overall: score.overallRounded,
    grade: score.grade,
    rushLabel: score.rushLabel,
    subScores: toSubScoreViews(score.subScores),
    strengths: deriveStrengths(score.subScores),
    weaknesses,
    diagnosis:
      draft?.diagnosis ?? deterministicDiagnosis(score, topWeakness?.label),
    roadmap: draft
      ? draftRoadmap(draft, score.gaps)
      : deterministicRoadmap(score.gaps),
    recommendations: draft?.goalTips
      ? [...draft.goalTips]
      : deterministicTips(score.goal),
    aiAuthored: draft !== null,
    confidence: input.confidence ?? (draft ? 0.9 : 1),
    needsHumanReview: input.needsHumanReview ?? false,
    referenceReady: readiness.ready,
    unverifiedFields: readiness.unverifiedFields,
  };
}
