import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { Repositories, RepoDeps } from '@/lib/db';
import { AnalyticsService, MemoryAnalyticsProvider } from '@/lib/analytics';
import {
  assignVariant,
  evaluateFlag,
  ExperimentError,
  ExperimentService,
  hashFraction,
  type Experiment,
  type FeatureFlag,
} from '@/lib/experiments';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

const TWO_WAY: Experiment = {
  key: 'exp_ab',
  title: 'A/B',
  hypothesis: 'b beats a',
  metric: 'conv',
  status: 'running',
  variants: [
    { key: 'a', weight: 1 },
    { key: 'b', weight: 1 },
  ],
};

describe('deterministic bucketing', () => {
  it('hashFraction is stable and within [0,1)', () => {
    const a = hashFraction('seed-1');
    expect(a).toBe(hashFraction('seed-1'));
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(hashFraction('seed-2')).not.toBe(a);
  });

  it('assignVariant is sticky and roughly balanced', () => {
    const first = assignVariant(TWO_WAY, 'user-42');
    expect(assignVariant(TWO_WAY, 'user-42')).toBe(first);

    let a = 0;
    for (let i = 0; i < 1000; i++) {
      if (assignVariant(TWO_WAY, `user-${i}`) === 'a') a++;
    }
    expect(a).toBeGreaterThan(400);
    expect(a).toBeLessThan(600);
  });

  it('respects variant weights', () => {
    const weighted: Experiment = {
      ...TWO_WAY,
      variants: [
        { key: 'a', weight: 9 },
        { key: 'b', weight: 1 },
      ],
    };
    let a = 0;
    for (let i = 0; i < 1000; i++) {
      if (assignVariant(weighted, `u-${i}`) === 'a') a++;
    }
    expect(a).toBeGreaterThan(820);
  });

  it('evaluateFlag honors enabled + rollout bounds', () => {
    const off: FeatureFlag = {
      key: 'f',
      description: '',
      enabled: false,
      rolloutPct: 100,
    };
    const full: FeatureFlag = {
      key: 'f',
      description: '',
      enabled: true,
      rolloutPct: 100,
    };
    const none: FeatureFlag = {
      key: 'f',
      description: '',
      enabled: true,
      rolloutPct: 0,
    };
    expect(evaluateFlag(off, 'u')).toBe(false);
    expect(evaluateFlag(full, 'u')).toBe(true);
    expect(evaluateFlag(none, 'u')).toBe(false);
  });
});

describe('ExperimentService', () => {
  let repos: Repositories;
  let sink: MemoryAnalyticsProvider;
  let svc: ExperimentService;
  beforeEach(() => {
    repos = createInMemoryRepositories(deps());
    sink = new MemoryAnalyticsProvider();
    svc = new ExperimentService({
      repo: repos.experimentAssignments,
      analytics: new AnalyticsService({ provider: sink }),
      experiments: [TWO_WAY],
    });
  });

  it('assigns, persists, and emits exactly one exposure (sticky)', async () => {
    const first = await svc.assign('user-7', 'exp_ab');
    expect(['a', 'b']).toContain(first.variant);
    expect(sink.events).toHaveLength(1);
    expect(sink.events[0]?.name).toBe('experiment_exposed');

    const again = await svc.assign('user-7', 'exp_ab');
    expect(again.variant).toBe(first.variant);
    // No second exposure — assignment was already persisted.
    expect(sink.events).toHaveLength(1);
    expect(
      await repos.experimentAssignments.listByExperiment('exp_ab'),
    ).toHaveLength(1);
  });

  it('throws on an unknown experiment', async () => {
    await expect(svc.assign('u', 'missing')).rejects.toBeInstanceOf(
      ExperimentError,
    );
  });

  it('evaluates registry feature flags and denies unknown ones', () => {
    const real = new ExperimentService();
    expect(real.flag('referrals_enabled', 'u1')).toBe(true);
    expect(real.flag('does_not_exist', 'u1')).toBe(false);
  });

  it('degrades to stateless assignment when the store is down (device-found bug)', async () => {
    const brokenRepo = {
      async create() {
        throw new Error(
          'Failed query: insert into "experiment_assignments" ...',
        );
      },
      async findBySubject() {
        throw new Error('Failed query: select ... experiment_assignments ...');
      },
      async listByExperiment() {
        return [];
      },
      async list() {
        return [];
      },
    };
    const resilient = new ExperimentService({
      repo: brokenRepo,
      experiments: [TWO_WAY],
    });
    const a = await resilient.assign('user-7', 'exp_ab');
    expect(['a', 'b']).toContain(a.variant);
    // Deterministic: same subject → same variant even without persistence.
    const again = await resilient.assign('user-7', 'exp_ab');
    expect(again.variant).toBe(a.variant);
  });
});
