import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST as trackPOST } from '@/app/api/analytics/track/route';
import { POST as assignPOST } from '@/app/api/experiments/assign/route';
import { GET as flagsGET } from '@/app/api/experiments/flags/route';
import { POST as referralPOST } from '@/app/api/referrals/route';
import { GET as dashboardGET } from '@/app/api/growth/dashboard/route';

function post(url: string, payload: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const saved: Record<string, string | undefined> = {};
const GATED = ['DATABASE_URL', 'NEXT_PUBLIC_POSTHOG_KEY'];
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

describe('growth routes', () => {
  it('analytics/track captures a valid event with no credentials', async () => {
    const res = await trackPOST(
      post('http://localhost/api/analytics/track', {
        name: 'teaser_completed',
        context: { anonId: 'a1' },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).persisted).toBe(false);
  });

  it('analytics/track 422s an unknown event', async () => {
    const res = await trackPOST(
      post('http://localhost/api/analytics/track', { name: 'nope' }),
    );
    expect(res.status).toBe(422);
  });

  it('experiments/assign returns a variant', async () => {
    const res = await assignPOST(
      post('http://localhost/api/experiments/assign', {
        subjectId: 'u1',
        experimentKey: 'teaser_reveal_depth',
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).variant).toBeDefined();
  });

  it('experiments/flags evaluates flags for a subject', async () => {
    const res = await flagsGET(
      new Request('http://localhost/api/experiments/flags?subjectId=u1'),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).flags.length).toBeGreaterThan(0);
  });

  it('referrals 503 without a database', async () => {
    const res = await referralPOST();
    expect(res.status).toBe(503);
  });

  it('growth/dashboard 503 without a database', async () => {
    const res = await dashboardGET();
    expect(res.status).toBe(503);
  });
});
