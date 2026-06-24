/**
 * Experimentation primitives (Phase 7). Feature flags + A/B experiments with
 * deterministic, sticky per-subject assignment. Mirrors the PostHog model so the
 * same experiment keys can be reconciled with PostHog once activated. Pure types
 * — assignment logic lives in `assignment.ts`.
 */

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface Variant {
  readonly key: string;
  /** Relative weight; assignment is proportional across an experiment's variants. */
  readonly weight: number;
}

export interface Experiment {
  readonly key: string;
  readonly title: string;
  readonly hypothesis: string;
  /** The single success metric (roadmap §11 discipline). */
  readonly metric: string;
  readonly status: ExperimentStatus;
  readonly variants: readonly Variant[];
}

export interface FeatureFlag {
  readonly key: string;
  readonly description: string;
  readonly enabled: boolean;
  /** Percentage rollout [0,100] among enabled flags, deterministic per subject. */
  readonly rolloutPct: number;
}

export interface Assignment {
  readonly subjectId: string;
  readonly experimentKey: string;
  readonly variant: string;
}
