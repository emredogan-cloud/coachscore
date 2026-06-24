import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST as applyPOST } from '@/app/api/coach/apply/route';
import { POST as ratePOST } from '@/app/api/coach/rate/route';
import { POST as disputePOST } from '@/app/api/dispute/route';

function post(url: string, payload: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  saved.DATABASE_URL = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
});
afterEach(() => {
  if (saved.DATABASE_URL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = saved.DATABASE_URL;
});

describe('marketplace routes (not activated)', () => {
  it('coach/apply returns 503 without a database', async () => {
    const res = await applyPOST(
      post('http://localhost/api/coach/apply', {
        displayName: 'C',
        bio: 'I have coached war clans for years and want to help here.',
        specialties: ['war'],
        motivation: 'I want to help players climb the war ladder here.',
        experience: 'Led several clans to Champion League over seasons.',
      }),
    );
    expect(res.status).toBe(503);
  });

  it('coach/rate returns 503 without a database', async () => {
    const res = await ratePOST(
      post('http://localhost/api/coach/rate', { coachId: 'c1', stars: 5 }),
    );
    expect(res.status).toBe(503);
  });

  it('dispute returns 503 without a database', async () => {
    const res = await disputePOST(
      post('http://localhost/api/dispute', {
        reason: 'a sufficiently long dispute reason',
      }),
    );
    expect(res.status).toBe(503);
  });

  it('returns 422 on invalid JSON', async () => {
    const res = await applyPOST(
      new Request('http://localhost/api/coach/apply', {
        method: 'POST',
        body: 'not json',
      }),
    );
    expect(res.status).toBe(422);
  });
});
