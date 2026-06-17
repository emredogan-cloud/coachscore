/**
 * Anti-hallucination verifier (ADR 0005).
 *
 * The decision-driving part of the report is the structured roadmap. We verify
 * it against the engine's gap list — the single source of numeric truth — so
 * the model cannot invent an upgrade, target a non-existent element, or alter a
 * level. A violation rejects the draft (the orchestrator retries, then flags for
 * human review). Prose is additionally scanned as a soft signal only.
 */

import type { CoachScoreResult } from '@/lib/core';
import type { ReportDraft } from './types';

export interface VerificationResult {
  readonly ok: boolean;
  readonly violations: readonly string[];
  /** Numbers in the prose not traceable to computed values (soft signal). */
  readonly proseWarnings: readonly string[];
}

/**
 * Verify the roadmap references only real gaps with exact levels, and scan the
 * diagnosis prose for untraceable multi-digit numbers (soft warning).
 */
export function verifyDraftAgainstResult(
  draft: ReportDraft,
  result: CoachScoreResult,
): VerificationResult {
  const violations: string[] = [];
  const gapById = new Map(result.gaps.map((g) => [g.id, g]));

  for (const item of draft.roadmap) {
    const gap = gapById.get(item.elementId);
    if (!gap) {
      violations.push(
        `Roadmap references unknown elementId "${item.elementId}" (not in the gap list).`,
      );
      continue;
    }
    if (item.fromLevel !== gap.level) {
      violations.push(
        `Roadmap "${item.elementId}" fromLevel ${item.fromLevel} != computed ${gap.level}.`,
      );
    }
    if (item.toLevel !== gap.maxLevel) {
      violations.push(
        `Roadmap "${item.elementId}" toLevel ${item.toLevel} != computed max ${gap.maxLevel}.`,
      );
    }
  }

  // Soft prose check: collect the set of numbers the model is allowed to cite.
  const allowed = new Set<number>();
  allowed.add(result.overallRounded);
  for (const v of Object.values(result.subScores)) {
    if (v !== null) allowed.add(Math.round(v));
  }
  for (const g of result.gaps) {
    allowed.add(g.level);
    allowed.add(g.maxLevel);
  }
  const proseWarnings: string[] = [];
  const numbers = draft.diagnosis.match(/\d{2,}/g) ?? [];
  for (const raw of numbers) {
    const n = Number(raw);
    if (!allowed.has(n)) {
      proseWarnings.push(
        `Diagnosis cites "${raw}", which is not a computed value (verify wording).`,
      );
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    proseWarnings,
  };
}
