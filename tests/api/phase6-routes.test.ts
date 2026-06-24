import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST as submitPOST } from '@/app/api/products/submit/route';
import { POST as checkoutPOST } from '@/app/api/products/checkout/route';
import { GET as reportGET } from '@/app/api/products/report/[id]/route';

function post(url: string, payload: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const saved: Record<string, string | undefined> = {};
const GATED = ['DATABASE_URL', 'ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY'];
beforeEach(() => {
  for (const k of GATED) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of GATED) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const replaySubmission = {
  sku: 'replay_doctor',
  input: {
    townHall: 14,
    context: 'war',
    starsEarned: 3,
    destructionPct: 100,
    durationSec: 150,
    timeRemainingSec: 60,
  },
};

describe('product routes (not activated)', () => {
  it('submit computes the report inline with no credentials', async () => {
    const res = await submitPOST(
      post('http://localhost/api/products/submit', replaySubmission),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      report: { aiAuthored: boolean };
      persistence: { reason?: string };
    };
    expect(body.ok).toBe(true);
    expect(body.report.aiAuthored).toBe(false);
    expect(body.persistence.reason).toBe('database_not_configured');
  });

  it('submit returns 422 on invalid JSON', async () => {
    const res = await submitPOST(
      new Request('http://localhost/api/products/submit', {
        method: 'POST',
        body: 'not json',
      }),
    );
    expect(res.status).toBe(422);
  });

  it('checkout returns 503 without Stripe + a database', async () => {
    const res = await checkoutPOST(
      post('http://localhost/api/products/checkout', { sku: 'war_plan' }),
    );
    expect(res.status).toBe(503);
  });

  it('report retrieval returns 503 without a database', async () => {
    const res = await reportGET(
      new Request('http://localhost/api/products/report/abc'),
      { params: Promise.resolve({ id: 'abc' }) },
    );
    expect(res.status).toBe(503);
  });
});
