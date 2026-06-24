import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { Repositories, RepoDeps } from '@/lib/db';
import {
  ACQUISITION_FUNNEL,
  AnalyticsError,
  AnalyticsService,
  computeFunnel,
  eventsByCategory,
  isAnalyticsEventName,
  MemoryAnalyticsProvider,
  stripPii,
} from '@/lib/analytics';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

describe('taxonomy', () => {
  it('recognizes known events and rejects unknown', () => {
    expect(isAnalyticsEventName('checkout_started')).toBe(true);
    expect(isAnalyticsEventName('nope')).toBe(false);
  });

  it('groups events by category', () => {
    expect(eventsByCategory('conversion')).toContain('report_delivered');
    expect(eventsByCategory('viral')).toContain('share_card_generated');
  });

  it('strips PII property keys (GDPR/KVKK) and keeps the rest', () => {
    const { clean, dropped } = stripPii({
      email: 'a@b.com',
      playerTag: '#ABC',
      townHall: 14,
      grade: 'A',
    });
    expect(dropped).toEqual(expect.arrayContaining(['email', 'playerTag']));
    expect(clean).toEqual({ townHall: 14, grade: 'A' });
  });
});

describe('computeFunnel', () => {
  it('computes step + cumulative conversion from event counts', () => {
    const result = computeFunnel(ACQUISITION_FUNNEL, {
      landing_viewed: 1000,
      teaser_started: 500,
      teaser_completed: 350,
      checkout_started: 50,
      report_delivered: 35,
    });
    expect(result.steps[0]?.stepConversion).toBe(1);
    expect(result.steps[1]?.stepConversion).toBe(0.5);
    expect(result.steps[2]?.cumulativeConversion).toBe(0.35);
    expect(result.overallConversion).toBeCloseTo(0.035, 5);
  });

  it('handles a zero top-of-funnel without dividing by zero', () => {
    const result = computeFunnel(ACQUISITION_FUNNEL, {});
    expect(result.overallConversion).toBe(0);
    expect(result.steps.every((s) => s.count === 0)).toBe(true);
  });
});

describe('AnalyticsService', () => {
  let repos: Repositories;
  let sink: MemoryAnalyticsProvider;
  let svc: AnalyticsService;
  beforeEach(() => {
    repos = createInMemoryRepositories(deps());
    sink = new MemoryAnalyticsProvider();
    svc = new AnalyticsService({ provider: sink, repo: repos.analyticsEvents });
  });

  it('captures + persists a valid event, scrubbing PII', async () => {
    const captured = await svc.track({
      name: 'checkout_started',
      properties: { sku: 'standard', email: 'leak@x.com' },
      context: { userId: 'u1', source: 'web' },
    });
    expect(captured.distinctId).toBe('u1');
    expect(captured.properties).toEqual({ sku: 'standard' });
    expect(sink.events).toHaveLength(1);
    const persisted = await repos.analyticsEvents.list();
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.name).toBe('checkout_started');
    expect(persisted[0]?.properties).toEqual({ sku: 'standard' });
  });

  it('falls back to anonId then "anonymous" for the distinct id', async () => {
    const a = await svc.track({
      name: 'landing_viewed',
      context: { anonId: 'anon-9' },
    });
    expect(a.distinctId).toBe('anon-9');
    const b = await svc.track({ name: 'landing_viewed' });
    expect(b.distinctId).toBe('anonymous');
  });

  it('rejects an event outside the taxonomy', async () => {
    await expect(svc.track({ name: 'made_up_event' })).rejects.toBeInstanceOf(
      AnalyticsError,
    );
  });

  it('works with no repo (forward-only)', async () => {
    const forwardOnly = new AnalyticsService({ provider: sink });
    await forwardOnly.track({ name: 'teaser_started' });
    expect(sink.events).toHaveLength(1);
  });

  it('is best-effort: a failing persistence sink never throws (device-found bug)', async () => {
    const brokenRepo = {
      async create() {
        throw new Error('Failed query: insert into "analytics_events" ...');
      },
      async list() {
        return [];
      },
      async listByName() {
        return [];
      },
    };
    const svcWithBrokenDb = new AnalyticsService({
      provider: sink,
      repo: brokenRepo,
    });
    const captured = await svcWithBrokenDb.track({ name: 'teaser_completed' });
    expect(captured.name).toBe('teaser_completed');
    expect(sink.events).toHaveLength(1); // forward sink still received it
  });

  it('is best-effort: a failing forward sink never throws', async () => {
    const brokenProvider = {
      async capture() {
        throw new Error('posthog down');
      },
    };
    const svc2 = new AnalyticsService({ provider: brokenProvider });
    await expect(svc2.track({ name: 'landing_viewed' })).resolves.toBeTruthy();
  });
});
