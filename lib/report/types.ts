/**
 * Report-experience types (Phase 4).
 *
 * A `RenderableReport` is the single, version-locked view model the report page,
 * the PDF, and the share card all render from. It is assembled deterministically
 * from a snapshot + engine result; an optional AI draft enriches the prose but is
 * never required (so the full report renders with no AI credential).
 */

import type { Goal, Grade, RushLabel, SubScoreKey } from '@/lib/core';
import type { ImpactLevel } from '@/lib/ai';

export interface SubScoreView {
  readonly key: SubScoreKey;
  readonly label: string;
  /** null when the dimension is N/A (e.g. Equipment below TH16). */
  readonly value: number | null;
}

export interface ReportStrength {
  readonly key: SubScoreKey;
  readonly label: string;
  readonly value: number;
}

export type ReportWeakness = ReportStrength;

export interface ReportRoadmapStep {
  readonly rank: number;
  readonly elementId: string;
  readonly category: SubScoreKey;
  readonly fromLevel: number;
  readonly toLevel: number;
  readonly rationale: string;
  readonly estimatedImpact: ImpactLevel;
}

/** Everything needed to reproduce/identify a report (version locking). */
export interface ReportVersion {
  readonly formatVersion: string;
  readonly engineVersion: string;
  readonly referenceTableVersion: string;
  readonly knowledgeBaseVersion: string;
  readonly snapshotHash: string;
  /** A single human-readable composite version string. */
  readonly composite: string;
}

export interface RenderableReport {
  readonly version: ReportVersion;
  readonly townHall: number;
  readonly goal: Goal;
  readonly overall: number;
  readonly grade: Grade;
  readonly rushLabel: RushLabel;
  readonly subScores: readonly SubScoreView[];
  readonly strengths: readonly ReportStrength[];
  readonly weaknesses: readonly ReportWeakness[];
  readonly diagnosis: string;
  readonly roadmap: readonly ReportRoadmapStep[];
  readonly recommendations: readonly string[];
  /** True when an AI draft backed the diagnosis/roadmap prose. */
  readonly aiAuthored: boolean;
  readonly confidence: number;
  readonly needsHumanReview: boolean;
  /** Reference-data readiness for this Town Hall (paid-report gate). */
  readonly referenceReady: boolean;
  readonly unverifiedFields: readonly string[];
}

/** The free teaser: enough to prove value, with premium sections locked. */
export interface ReportTeaser {
  readonly grade: Grade;
  readonly overall: number;
  readonly townHall: number;
  readonly goal: Goal;
  readonly rushLabel: RushLabel;
  readonly headline: string;
  readonly topWeakness: ReportWeakness | null;
  readonly lockedSections: readonly string[];
}
