/**
 * Confidence scoring for AI outputs (ADR 0005). A draft below CONFIDENCE_FLOOR
 * is flagged for human review and (for the AI-only tier, Phase 3) must not
 * auto-ship. Pure and deterministic.
 */

import type { CoachScoreResult } from '@/lib/core';
import type { ExtractedField, ReportDraft } from './types';
import { CONFIDENCE_FLOOR } from './types';

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export interface DraftConfidence {
  readonly score: number;
  readonly flags: readonly string[];
}

/**
 * Score a draft by how well it covers the top-priority gaps and whether all its
 * roadmap items are real gaps, lightly penalizing untraceable prose numbers.
 */
export function scoreDraftConfidence(
  draft: ReportDraft,
  result: CoachScoreResult,
  proseWarningCount = 0,
): DraftConfidence {
  const flags: string[] = [];

  if (result.gaps.length === 0) {
    // No gaps to cover — confidence is governed solely by prose cleanliness.
    const penalty = Math.min(0.2, proseWarningCount * 0.05);
    return { score: clamp01(1 - penalty), flags };
  }

  const topN = Math.min(5, result.gaps.length);
  const topGapIds = new Set(result.gaps.slice(0, topN).map((g) => g.id));
  const gapIds = new Set(result.gaps.map((g) => g.id));

  const roadmapIds = draft.roadmap.map((r) => r.elementId);
  const addressedTop = [...topGapIds].filter((id) => roadmapIds.includes(id));
  const coverage = addressedTop.length / topN;
  if (coverage < 1) {
    flags.push(
      `Roadmap covers ${addressedTop.length}/${topN} top-priority gaps.`,
    );
  }

  const validItems = roadmapIds.filter((id) => gapIds.has(id)).length;
  const validRatio = roadmapIds.length > 0 ? validItems / roadmapIds.length : 0;
  if (validRatio < 1) {
    flags.push('Roadmap contains items not present in the gap list.');
  }

  const prosePenalty = Math.min(0.2, proseWarningCount * 0.05);
  if (proseWarningCount > 0) {
    flags.push(`${proseWarningCount} untraceable number(s) in the diagnosis.`);
  }

  const score = clamp01(0.3 + 0.5 * coverage + 0.2 * validRatio - prosePenalty);
  if (score < CONFIDENCE_FLOOR) {
    flags.push('Confidence below floor — route to human review.');
  }
  return { score, flags };
}

/** Mark extracted fields below the floor as needing user confirmation. */
export function routeExtractionConfidence(
  fields: readonly Omit<ExtractedField, 'needsConfirmation'>[],
): ExtractedField[] {
  return fields.map((f) => ({
    ...f,
    needsConfirmation: f.confidence < CONFIDENCE_FLOOR,
  }));
}
