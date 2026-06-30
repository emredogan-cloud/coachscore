import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import {
  CocApiAccessError,
  CocApiUnavailableError,
  CocPlayerNotFoundError,
  CocPlayerSchema,
  createCocAdapter,
  mapCocPlayerToFields,
  normalizeIntake,
  ProxyCocAdapter,
} from '@/lib/intake';

/** A realistic-ish TH16 player payload (field names per the real API). */
const TH16_PLAYER = {
  tag: '#2PP0LYQ',
  name: 'Tester',
  townHallLevel: 16,
  expLevel: 230,
  trophies: 4800,
  warStars: 1500,
  attackWins: 150,
  defenseWins: 20,
  donations: 1000,
  donationsReceived: 900,
  clanCapitalContributions: 100_000,
  warPreference: 'in',
  role: 'coLeader',
  clan: { tag: '#CLAN', name: 'A Clan' },
  heroes: [
    { name: 'Barbarian King', level: 90, maxLevel: 110, village: 'home' },
    { name: 'Archer Queen', level: 90, maxLevel: 110, village: 'home' },
    { name: 'Grand Warden', level: 65, maxLevel: 85, village: 'home' },
    { name: 'Royal Champion', level: 40, maxLevel: 55, village: 'home' },
    { name: 'Minion Prince', level: 60, maxLevel: 95, village: 'home' },
    { name: 'Battle Machine', level: 30, maxLevel: 35, village: 'builderBase' },
  ],
  troops: [
    { name: 'Barbarian', level: 11, maxLevel: 13, village: 'home' },
    {
      name: 'Super Barbarian',
      level: 11,
      maxLevel: 13,
      village: 'home',
      superTroopIsActive: false,
    },
    {
      name: 'Raged Barbarian',
      level: 18,
      maxLevel: 18,
      village: 'builderBase',
    },
  ],
  spells: [
    { name: 'Lightning Spell', level: 9, maxLevel: 11, village: 'home' },
  ],
  heroEquipment: [
    { name: 'Barbarian Puppet', level: 18, maxLevel: 27, village: 'home' },
    { name: 'Giant Gauntlet', level: 10, maxLevel: 27, village: 'home' },
  ],
};

describe('mapCocPlayerToFields', () => {
  const player = CocPlayerSchema.parse(TH16_PLAYER);
  const fields = mapCocPlayerToFields(player);

  it('maps Town Hall + home-village hero levels (builder heroes excluded)', () => {
    expect(fields.townHall).toBe(16);
    expect(fields.heroLevels).toMatchObject({
      barbarianKing: 90,
      archerQueen: 90,
      grandWarden: 65,
      royalChampion: 40,
      minionPrince: 60,
    });
  });

  it('computes offense from home troops+spells, excluding supers + builder base', () => {
    // Barbarian 11/13 + Lightning 9/11 = 20/24 ≈ 83. Super Barbarian (dup) and
    // Raged Barbarian (builder) are excluded.
    expect(fields.offensePercent).toBe(83);
  });

  it('marks defense + walls unknown (the API cannot read them)', () => {
    expect(fields.unknownDimensions).toContain('defense');
    expect(fields.unknownDimensions).toContain('walls');
  });

  it('derives equipment (TH16+) from the owned hero-equipment inventory', () => {
    expect(fields.equipment).toBeDefined();
    expect(fields.equipment?.levelSum).toBe(28); // 18 + 10
    expect(fields.equipment?.maxLevelSum).toBe(54); // 27 + 27
    expect(fields.equipment?.keyEpicsUnlocked).toBe(2);
  });

  it('derives clan signals in [0,1] from real counters', () => {
    for (const v of Object.values(fields.clan)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(fields.clan.donationBehavior).toBeCloseTo(0.5, 1); // 1000/2000
  });

  it('omits equipment below TH16', () => {
    const lowTh = mapCocPlayerToFields(
      CocPlayerSchema.parse({ ...TH16_PLAYER, townHallLevel: 14 }),
    );
    expect(lowTh.equipment).toBeUndefined();
  });
});

describe('tag-path scoring (defense + walls absent)', () => {
  it('renormalizes over readable dimensions instead of scoring unknowns as zero', () => {
    const fields = mapCocPlayerToFields(CocPlayerSchema.parse(TH16_PLAYER));
    const account = normalizeIntake(fields);
    const result = computeCoachScore(account, 'rate');
    expect(result.subScores.defense).toBeNull();
    expect(result.subScores.walls).toBeNull();
    // A strong account is NOT dragged toward zero by phantom defense/walls.
    expect(result.overall).toBeGreaterThan(50);
    expect(result.overall).toBeLessThanOrEqual(100);
  });
});

interface FakeResponse {
  readonly status: number;
  readonly body?: unknown;
}

function fakeFetch(queue: readonly FakeResponse[]) {
  const urls: string[] = [];
  let i = 0;
  const impl = (url: string) => {
    urls.push(url);
    const r = queue[Math.min(i, queue.length - 1)] ?? { status: 500 };
    i += 1;
    return Promise.resolve({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: { get: (_name: string): string | null => null },
      json: (): Promise<unknown> => Promise.resolve(r.body ?? {}),
      text: (): Promise<string> =>
        Promise.resolve(JSON.stringify(r.body ?? {})),
    });
  };
  return { impl, urls };
}

const noopLimiter = { acquire: (): Promise<void> => Promise.resolve() };
const noopSleep = (): Promise<void> => Promise.resolve();

function adapter(queue: readonly FakeResponse[]) {
  const { impl, urls } = fakeFetch(queue);
  const a = new ProxyCocAdapter({
    token: 'TEST_TOKEN',
    baseUrl: 'https://cocproxy.royaleapi.dev',
    fetchImpl: impl,
    sleep: noopSleep,
    limiter: noopLimiter,
    maxRetries: 3,
  });
  return { a, urls };
}

describe('ProxyCocAdapter', () => {
  it('fetches, validates, and maps a 200 response; encodes the # in the tag', async () => {
    const { a, urls } = adapter([{ status: 200, body: TH16_PLAYER }]);
    const data = await a.fetchAccount('#2PP0LYQ');
    expect(data.playerTag).toBe('#2PP0LYQ');
    expect(data.fields.townHall).toBe(16);
    expect(urls[0]).toContain('/v1/players/%232PP0LYQ');
  });

  it('caches within the TTL (second call does not re-fetch)', async () => {
    const { a, urls } = adapter([{ status: 200, body: TH16_PLAYER }]);
    await a.fetchAccount('#2PP0LYQ');
    await a.fetchAccount('#2PP0LYQ');
    expect(urls).toHaveLength(1);
  });

  it('maps 404 → CocPlayerNotFoundError (no retry)', async () => {
    const { a, urls } = adapter([
      { status: 404, body: { reason: 'notFound' } },
    ]);
    await expect(a.fetchAccount('#2PP0LYQ')).rejects.toBeInstanceOf(
      CocPlayerNotFoundError,
    );
    expect(urls).toHaveLength(1);
  });

  it('maps 403 → CocApiAccessError (no retry)', async () => {
    const { a, urls } = adapter([
      { status: 403, body: { reason: 'accessDenied.invalidIp' } },
    ]);
    await expect(a.fetchAccount('#2PP0LYQ')).rejects.toBeInstanceOf(
      CocApiAccessError,
    );
    expect(urls).toHaveLength(1);
  });

  it('retries 429 then succeeds', async () => {
    const { a, urls } = adapter([
      { status: 429, body: { reason: 'requestThrottled' } },
      { status: 429, body: { reason: 'requestThrottled' } },
      { status: 200, body: TH16_PLAYER },
    ]);
    const data = await a.fetchAccount('#2PP0LYQ');
    expect(data.fields.townHall).toBe(16);
    expect(urls).toHaveLength(3);
  });

  it('throws CocApiUnavailableError after exhausting retries on 503', async () => {
    const { a } = adapter([{ status: 503, body: { reason: 'inMaintenance' } }]);
    await expect(a.fetchAccount('#2PP0LYQ')).rejects.toBeInstanceOf(
      CocApiUnavailableError,
    );
  });

  it('rejects an invalid tag before any network call', async () => {
    const { a, urls } = adapter([{ status: 200, body: TH16_PLAYER }]);
    await expect(a.fetchAccount('not a tag!')).rejects.toThrow();
    expect(urls).toHaveLength(0);
  });

  it('honors a retry-after header over exponential backoff', async () => {
    const queue: FakeResponse[] = [
      { status: 429, body: { reason: 'requestThrottled' } },
      { status: 200, body: TH16_PLAYER },
    ];
    let i = 0;
    const impl = (_url: string) => {
      const r = queue[Math.min(i, queue.length - 1)] ?? { status: 500 };
      i += 1;
      const headers: Record<string, string> =
        r.status === 429 ? { 'retry-after': '2' } : {};
      return Promise.resolve({
        ok: r.status >= 200 && r.status < 300,
        status: r.status,
        headers: {
          get: (n: string): string | null => headers[n.toLowerCase()] ?? null,
        },
        json: (): Promise<unknown> => Promise.resolve(r.body ?? {}),
        text: (): Promise<string> => Promise.resolve(''),
      });
    };
    const delays: number[] = [];
    const a = new ProxyCocAdapter({
      token: 'T',
      baseUrl: 'https://cocproxy.royaleapi.dev',
      fetchImpl: impl,
      sleep: (ms: number): Promise<void> => {
        delays.push(ms);
        return Promise.resolve();
      },
      limiter: noopLimiter,
      maxRetries: 3,
    });
    const data = await a.fetchAccount('#2PP0LYQ');
    expect(data.fields.townHall).toBe(16);
    // 2s from the header, not the ~250ms+jitter exponential backoff.
    expect(delays[0]).toBe(2000);
  });

  it('caps an absurd retry-after to maxRetryAfterMs', async () => {
    let i = 0;
    const impl = (_url: string) => {
      const status = i === 0 ? 503 : 200;
      i += 1;
      const headers: Record<string, string> =
        status === 503 ? { 'retry-after': '99999' } : {};
      return Promise.resolve({
        ok: status === 200,
        status,
        headers: {
          get: (n: string): string | null => headers[n.toLowerCase()] ?? null,
        },
        json: (): Promise<unknown> =>
          Promise.resolve(status === 200 ? TH16_PLAYER : {}),
        text: (): Promise<string> => Promise.resolve(''),
      });
    };
    const delays: number[] = [];
    const a = new ProxyCocAdapter({
      token: 'T',
      baseUrl: 'https://cocproxy.royaleapi.dev',
      fetchImpl: impl,
      sleep: (ms: number): Promise<void> => {
        delays.push(ms);
        return Promise.resolve();
      },
      limiter: noopLimiter,
      maxRetries: 2,
      maxRetryAfterMs: 5_000,
    });
    await a.fetchAccount('#2PP0LYQ');
    expect(delays[0]).toBe(5_000);
  });

  it('evicts the oldest cached player past maxCacheEntries', async () => {
    const { impl, urls } = fakeFetch([{ status: 200, body: TH16_PLAYER }]);
    const a = new ProxyCocAdapter({
      token: 'T',
      baseUrl: 'https://cocproxy.royaleapi.dev',
      fetchImpl: impl,
      sleep: noopSleep,
      limiter: noopLimiter,
      maxCacheEntries: 1,
    });
    await a.fetchAccount('#2PP0LYQ'); // fetch A → cache {A}
    await a.fetchAccount('#2PP0LYQ'); // A cached → no fetch
    await a.fetchAccount('#2PP0LY'); // fetch B → evicts A, cache {B}
    await a.fetchAccount('#2PP0LYQ'); // A was evicted → fetch again
    expect(urls).toHaveLength(3);
  });
});

describe('createCocAdapter (process singleton)', () => {
  function withEnv(
    token: string | undefined,
    url: string | undefined,
    fn: () => void,
  ) {
    const prevToken = process.env.COC_API_TOKEN;
    const prevUrl = process.env.COC_API_PROXY_URL;
    if (token === undefined) delete process.env.COC_API_TOKEN;
    else process.env.COC_API_TOKEN = token;
    if (url === undefined) delete process.env.COC_API_PROXY_URL;
    else process.env.COC_API_PROXY_URL = url;
    try {
      fn();
    } finally {
      if (prevToken === undefined) delete process.env.COC_API_TOKEN;
      else process.env.COC_API_TOKEN = prevToken;
      if (prevUrl === undefined) delete process.env.COC_API_PROXY_URL;
      else process.env.COC_API_PROXY_URL = prevUrl;
    }
  }

  it('reuses one ProxyCocAdapter across calls when configured', () => {
    withEnv('TEST_TOKEN', 'https://cocproxy.royaleapi.dev', () => {
      const a = createCocAdapter();
      const b = createCocAdapter();
      expect(a).toBe(b);
      expect(a).toBeInstanceOf(ProxyCocAdapter);
    });
  });

  it('returns a non-proxy NotConfigured adapter when creds are absent', () => {
    withEnv(undefined, undefined, () => {
      expect(createCocAdapter()).not.toBeInstanceOf(ProxyCocAdapter);
    });
  });
});
