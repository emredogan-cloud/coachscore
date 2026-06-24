import { describe, expect, it } from 'vitest';
import {
  handleProductCheckout,
  handleProductReport,
  handleProductSubmit,
  type ProductSubmitResponseBody,
} from '@/lib/api';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import type { PaymentProvider } from '@/lib/payments';
import { fakeProvider } from '../intake/helpers';

function repoDeps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

const fakePayment: PaymentProvider = {
  async createCheckoutSession() {
    return { sessionId: 'cs_prod', url: 'https://stripe.test/cs_prod' };
  },
};

const replaySubmission = {
  sku: 'replay_doctor',
  input: {
    townHall: 14,
    context: 'war',
    starsEarned: 2,
    destructionPct: 80,
    durationSec: 180,
    timeRemainingSec: 30,
  },
  context: 'War day attack',
};

describe('handleProductSubmit', () => {
  it('rejects an invalid body and an invalid per-SKU input', async () => {
    expect((await handleProductSubmit({ sku: 'nope' })).status).toBe(422);
    expect(
      (
        await handleProductSubmit({
          sku: 'replay_doctor',
          input: { townHall: 99 },
        })
      ).status,
    ).toBe(422);
  });

  it('returns the deterministic report inline with no credentials', async () => {
    const res = await handleProductSubmit(replaySubmission, {
      isAiConfigured: () => false,
      isDbConfigured: () => false,
    });
    expect(res.status).toBe(200);
    const body = res.body as ProductSubmitResponseBody;
    expect(body.ok).toBe(true);
    expect(body.sku).toBe('replay_doctor');
    expect(body.report.aiAuthored).toBe(false);
    expect(body.persistence).toEqual({
      attempted: false,
      persisted: false,
      reason: 'database_not_configured',
    });
  });

  it('AI-enriches when ANTHROPIC is configured', async () => {
    const res = await handleProductSubmit(replaySubmission, {
      isAiConfigured: () => true,
      provider: fakeProvider({
        summary:
          'A grounded summary of the attack, comfortably over twenty chars.',
        recommendations: ['Funnel both sides before the core.'],
      }),
      isDbConfigured: () => false,
    });
    const body = res.body as ProductSubmitResponseBody;
    expect(body.report.aiAuthored).toBe(true);
    expect(body.report.confidence).toBe(0.9);
  });

  it('persists via the injected persist seam when the DB is activated', async () => {
    const res = await handleProductSubmit(replaySubmission, {
      isAiConfigured: () => false,
      isDbConfigured: () => true,
      persist: async () => ({
        attempted: true,
        persisted: true,
        reportId: 'prod-report-1',
      }),
    });
    const body = res.body as ProductSubmitResponseBody;
    expect(body.persistence.persisted).toBe(true);
    expect(body.persistence.reportId).toBe('prod-report-1');
  });
});

describe('handleProductCheckout', () => {
  it('rejects an invalid body', async () => {
    expect((await handleProductCheckout({ sku: 'basic' })).status).toBe(422);
  });

  it('returns 503 when payments are not activated', async () => {
    const res = await handleProductCheckout(
      { sku: 'replay_doctor' },
      { isActivated: () => false },
    );
    expect(res.status).toBe(503);
  });

  it('creates a product checkout session when activated', async () => {
    const res = await handleProductCheckout(
      { sku: 'replay_doctor' },
      {
        isActivated: () => true,
        provider: fakePayment,
        repos: createInMemoryRepositories(repoDeps()),
        appUrl: 'https://app.test',
      },
    );
    expect(res.status).toBe(200);
    const b = res.body as { url: string; amountCents: number };
    expect(b.url).toBe('https://stripe.test/cs_prod');
    expect(b.amountCents).toBe(900);
  });
});

describe('handleProductReport', () => {
  it('returns 503 when the database is not activated', async () => {
    const res = await handleProductReport('r1', {
      isDbConfigured: () => false,
    });
    expect(res.status).toBe(503);
  });

  it('returns 404 when the report is missing or not visible', async () => {
    const res = await handleProductReport('r1', {
      isDbConfigured: () => true,
      fetch: async () => null,
    });
    expect(res.status).toBe(404);
    expect((res.body as { error: { code: string } }).error.code).toBe(
      'not_found',
    );
  });

  it('returns the report when found and visible', async () => {
    const res = await handleProductReport('r1', {
      isDbConfigured: () => true,
      fetch: async () => ({
        sku: 'replay_doctor',
        title: 'ReplayDoctor',
        version: 'p1.0.0+replay_doctor',
        confidence: 1,
        aiAuthored: false,
        score: { label: 'Attack score', value: 80 },
        summary: 'ok',
        sections: [],
        recommendations: [],
      }),
    });
    expect(res.status).toBe(200);
    expect((res.body as { ok: boolean }).ok).toBe(true);
  });
});
