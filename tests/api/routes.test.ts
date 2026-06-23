import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST as manualPOST } from '@/app/api/intake/manual/route';
import { POST as tagPOST } from '@/app/api/intake/tag/route';
import { POST as screenshotPOST } from '@/app/api/intake/screenshot/route';

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

const ENV = ['DATABASE_URL', 'ANTHROPIC_API_KEY'] as const;
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

describe('POST /api/intake/manual', () => {
  it('scores a valid manual body', async () => {
    const res = await manualPOST(
      post('http://localhost/api/intake/manual', { goal: 'war', fields }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      score: { grade: string };
      ok: boolean;
    };
    expect(json.ok).toBe(true);
    expect(json.score.grade).toBe('A');
  });

  it('returns 422 on invalid JSON', async () => {
    const res = await manualPOST(
      new Request('http://localhost/api/intake/manual', {
        method: 'POST',
        body: 'not json',
      }),
    );
    expect(res.status).toBe(422);
  });
});

describe('POST /api/intake/tag', () => {
  it('returns 503 not_activated (no CoC proxy)', async () => {
    const res = await tagPOST(
      post('http://localhost/api/intake/tag', {
        goal: 'war',
        playerTag: '#2PP0',
      }),
    );
    expect(res.status).toBe(503);
  });
});

describe('POST /api/intake/screenshot', () => {
  it('returns 503 not_activated (no ANTHROPIC_API_KEY)', async () => {
    const res = await screenshotPOST(
      post('http://localhost/api/intake/screenshot', {
        goal: 'war',
        townHall: 14,
        images: [{ mediaType: 'image/png', dataBase64: 'AAAA' }],
      }),
    );
    expect(res.status).toBe(503);
  });
});
