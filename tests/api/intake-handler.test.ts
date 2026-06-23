import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  handleManualIntake,
  handleScreenshotIntake,
  handleTagIntake,
  type IntakeResponseBody,
  type PersistenceInfo,
} from '@/lib/api';
import type { CocAccountData, CocApiAdapter, IntakeFields } from '@/lib/intake';
import { fakeProvider } from '../intake/helpers';

const fields: IntakeFields = {
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
const manualBody = { goal: 'war', fields };

const body = (r: { body: unknown }): IntakeResponseBody =>
  r.body as IntakeResponseBody;

// Keep activation env deterministic across handler tests.
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

describe('handleManualIntake', () => {
  it('scores and reports persistence not attempted when the DB is off (default deps)', async () => {
    const res = await handleManualIntake(manualBody);
    expect(res.status).toBe(200);
    const b = body(res);
    expect(b.ok).toBe(true);
    expect(b.score?.grade).toBe('A');
    expect(b.snapshotHash).not.toBeNull();
    expect(b.persistence).toEqual({
      attempted: false,
      persisted: false,
      reason: 'database_not_configured',
    });
  });

  it('persists via the injected persister when the DB is on', async () => {
    const persisted: PersistenceInfo = {
      attempted: true,
      persisted: true,
      accountId: 'acc-1',
      snapshotId: 'snap-1',
    };
    const res = await handleManualIntake(manualBody, {
      isDbConfigured: () => true,
      persist: async () => persisted,
    });
    expect(res.status).toBe(200);
    expect(body(res).persistence).toEqual(persisted);
  });

  it('rejects an invalid body with 422', async () => {
    const res = await handleManualIntake({ goal: 'nope', fields });
    expect(res.status).toBe(422);
  });
});

describe('handleTagIntake', () => {
  it('returns 503 not_activated with the default (unconfigured) adapter', async () => {
    const res = await handleTagIntake({ goal: 'war', playerTag: '#2PP0' });
    expect(res.status).toBe(503);
  });

  it('returns 422 for a malformed player tag', async () => {
    const res = await handleTagIntake({ goal: 'war', playerTag: 'ZZZ' });
    expect(res.status).toBe(422);
  });

  it('scores when a configured adapter returns data', async () => {
    const adapter: CocApiAdapter = {
      async fetchAccount(playerTag: string): Promise<CocAccountData> {
        return { playerTag, fields };
      },
    };
    const res = await handleTagIntake(
      { goal: 'war', playerTag: '#2PP0' },
      { cocAdapter: adapter },
    );
    expect(res.status).toBe(200);
    expect(body(res).score?.grade).toBe('A');
  });

  it('rejects an invalid body with 422', async () => {
    const res = await handleTagIntake({ goal: 'war' });
    expect(res.status).toBe(422);
  });
});

describe('handleScreenshotIntake', () => {
  const screenshotBody = {
    goal: 'war',
    townHall: 14,
    context: 'TH14 war',
    images: [{ mediaType: 'image/png', dataBase64: 'AAAA' }],
  };

  it('returns 503 when AI is not activated (default deps)', async () => {
    const res = await handleScreenshotIntake(screenshotBody);
    expect(res.status).toBe(503);
  });

  it('extracts + scores with an injected provider when AI is on', async () => {
    const provider = fakeProvider({
      fields: [
        { key: 'barbarianKing', value: 72, confidence: 0.95 },
        { key: 'offensePercent', value: 85, confidence: 0.4 },
      ],
    });
    const res = await handleScreenshotIntake(screenshotBody, {
      isAiConfigured: () => true,
      provider,
    });
    expect(res.status).toBe(200);
    const b = body(res);
    expect(b.source).toBe('screenshot');
    expect(b.fieldsNeedingConfirmation).toContain('offensePercent');
  });

  it('rejects a body with no images (422)', async () => {
    const res = await handleScreenshotIntake({
      goal: 'war',
      townHall: 14,
      images: [],
    });
    expect(res.status).toBe(422);
  });
});
