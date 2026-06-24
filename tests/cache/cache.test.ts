import { describe, expect, it } from 'vitest';
import {
  MemoryCache,
  memoize,
  memoizeAsync,
  percentileCacheKey,
  reportCacheKey,
  scoreCacheKey,
  snapshotCacheKey,
} from '@/lib/cache';

describe('cache keys', () => {
  it('encode every invalidating input', () => {
    expect(reportCacheKey('abc', 'war', 'v2')).toBe('report:v2:war:abc');
    expect(scoreCacheKey('abc', 'war', 'v2')).toBe('score:v2:war:abc');
    expect(percentileCacheKey(14, 'v2')).toBe('percentile:v2:th14');
    expect(snapshotCacheKey('abc')).toBe('snapshot:abc');
    // A version bump changes the key (automatic invalidation).
    expect(reportCacheKey('abc', 'war', 'v3')).not.toBe(
      reportCacheKey('abc', 'war', 'v2'),
    );
  });
});

describe('MemoryCache', () => {
  it('stores and retrieves values', () => {
    const cache = new MemoryCache<number>();
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
    expect(cache.has('a')).toBe(true);
    expect(cache.get('missing')).toBeUndefined();
    cache.delete('a');
    expect(cache.has('a')).toBe(false);
  });

  it('expires entries past their TTL (injected clock)', () => {
    let t = 1000;
    const cache = new MemoryCache<string>({ ttlMs: 100, now: () => t });
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
    t = 1101; // past expiry
    expect(cache.get('k')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('evicts the least-recently-used entry past maxEntries', () => {
    const cache = new MemoryCache<number>({ maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // 'a' becomes most-recent → 'b' is now LRU
    cache.set('c', 3); // evicts 'b'
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
  });
});

describe('memoization', () => {
  it('memoize caches sync results by derived key', () => {
    const cache = new MemoryCache<number>();
    let calls = 0;
    const square = memoize(
      (n: number) => {
        calls += 1;
        return n * n;
      },
      { key: (n) => `sq:${n}`, cache },
    );
    expect(square(4)).toBe(16);
    expect(square(4)).toBe(16);
    expect(calls).toBe(1);
    square(5);
    expect(calls).toBe(2);
  });

  it('memoizeAsync dedupes repeated async work', async () => {
    const cache = new MemoryCache<string>();
    let calls = 0;
    const load = memoizeAsync(
      async (id: string) => {
        calls += 1;
        return `loaded:${id}`;
      },
      { key: (id) => id, cache },
    );
    expect(await load('x')).toBe('loaded:x');
    expect(await load('x')).toBe('loaded:x');
    expect(calls).toBe(1);
  });
});
