import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST as reportPOST } from '@/app/api/report/route';
import { POST as pdfPOST } from '@/app/api/report/pdf/route';
import { POST as checkoutPOST } from '@/app/api/checkout/route';
import { POST as webhookPOST } from '@/app/api/stripe/webhook/route';

const fields = {
  townHall: 14,
  heroLevels: {
    barbarianKing: 72,
    archerQueen: 75,
    grandWarden: 48,
    royalChampion: 22,
  },
  offensePercent: 85,
  defensePercent: 82,
  progressionPercent: 93,
  walls: { atOrAboveThMax: 85, total: 100 },
  clan: {
    donationBehavior: 0.78,
    warContribution: 0.78,
    capitalContribution: 0.78,
    activitySignal: 0.78,
  },
};

function post(url: string, payload: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const ENV = ['DATABASE_URL', 'STRIPE_SECRET_KEY'] as const;
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of ENV) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('POST /api/report', () => {
  it('returns the teaser for a valid body', async () => {
    const res = await reportPOST(
      post('http://localhost/api/report', { goal: 'war', fields }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { teaser: { grade: string } };
    expect(json.teaser.grade).toBe('A');
  });
});

describe('POST /api/report/pdf', () => {
  it('returns a PDF', async () => {
    const res = await pdfPOST(
      post('http://localhost/api/report/pdf', { goal: 'war', fields }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});

describe('POST /api/checkout', () => {
  it('returns 503 when payments are not activated', async () => {
    const res = await checkoutPOST(
      post('http://localhost/api/checkout', { sku: 'standard' }),
    );
    expect(res.status).toBe(503);
  });
});

describe('POST /api/stripe/webhook', () => {
  it('returns 503 when payments/DB are not activated', async () => {
    const res = await webhookPOST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=1,v1=x' },
        body: '{}',
      }),
    );
    expect(res.status).toBe(503);
  });
});
