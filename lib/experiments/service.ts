/**
 * Experiment service (Phase 7). Resolves a subject's variant (sticky), persists
 * the assignment when a repo is present, and emits a single exposure event the
 * first time a subject is exposed. Feature-flag checks are pure + synchronous.
 * Depends only on interfaces, so it is unit-tested with in-memory repos + a
 * memory analytics sink.
 */

import type { ExperimentAssignmentRepository } from '@/lib/db';
import type { AnalyticsService } from '@/lib/analytics';
import { assignVariant, evaluateFlag } from './assignment';
import { EXPERIMENTS, FEATURE_FLAGS, getExperiment, getFlag } from './catalog';
import type { Assignment, Experiment, FeatureFlag } from './types';

export class ExperimentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExperimentError';
  }
}

export interface ExperimentServiceDeps {
  /** Persisted assignments (DB-gated); makes exposure idempotent across calls. */
  readonly repo?: ExperimentAssignmentRepository;
  /** Exposure-event sink (analytics). */
  readonly analytics?: AnalyticsService;
  readonly experiments?: readonly Experiment[];
  readonly flags?: readonly FeatureFlag[];
}

export class ExperimentService {
  private readonly experiments: readonly Experiment[];
  private readonly flags: readonly FeatureFlag[];
  constructor(private readonly deps: ExperimentServiceDeps = {}) {
    this.experiments = deps.experiments ?? EXPERIMENTS;
    this.flags = deps.flags ?? FEATURE_FLAGS;
  }

  private experiment(key: string): Experiment {
    const exp =
      this.experiments.find((e) => e.key === key) ?? getExperiment(key);
    if (exp === null || exp === undefined) {
      throw new ExperimentError(`Unknown experiment "${key}".`);
    }
    return exp;
  }

  /** Assign (sticky) + persist on first exposure + emit one exposure event. */
  async assign(subjectId: string, experimentKey: string): Promise<Assignment> {
    const experiment = this.experiment(experimentKey);

    if (this.deps.repo) {
      const existing = await this.deps.repo.findBySubject(
        subjectId,
        experimentKey,
      );
      if (existing) {
        return {
          subjectId,
          experimentKey,
          variant: existing.variant,
        };
      }
    }

    const variant = assignVariant(experiment, subjectId);

    if (this.deps.repo) {
      await this.deps.repo.create({ subjectId, experimentKey, variant });
    }
    await this.recordExposure(subjectId, experimentKey, variant);

    return { subjectId, experimentKey, variant };
  }

  private async recordExposure(
    subjectId: string,
    experimentKey: string,
    variant: string,
  ): Promise<void> {
    if (!this.deps.analytics) return;
    await this.deps.analytics.track({
      name: 'experiment_exposed',
      properties: { experiment: experimentKey, variant },
      context: { anonId: subjectId },
    });
  }

  /** Evaluate a feature flag for a subject. Unknown flags are off (deny-by-default). */
  flag(key: string, subjectId: string): boolean {
    const flag = this.flags.find((f) => f.key === key) ?? getFlag(key);
    if (flag === null || flag === undefined) return false;
    return evaluateFlag(flag, subjectId);
  }

  listExperiments(): readonly Experiment[] {
    return this.experiments;
  }
  listFlags(): readonly FeatureFlag[] {
    return this.flags;
  }
}
