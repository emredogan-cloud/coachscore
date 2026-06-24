/**
 * Memoization layer (Phase 8). Wraps a (sync or async) function with a
 * `CacheStore`, deriving the key from the arguments. Identical calls return the
 * cached value without re-computing — the generic primitive behind the report /
 * percentile / snapshot caches.
 */

import type { CacheStore } from './types';

export interface MemoizeOptions<A extends unknown[], R> {
  readonly key: (...args: A) => string;
  readonly cache: CacheStore<R>;
}

export function memoize<A extends unknown[], R>(
  fn: (...args: A) => R,
  options: MemoizeOptions<A, R>,
): (...args: A) => R {
  return (...args: A): R => {
    const k = options.key(...args);
    const hit = options.cache.get(k);
    if (hit !== undefined) return hit;
    const result = fn(...args);
    options.cache.set(k, result);
    return result;
  };
}

export function memoizeAsync<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: MemoizeOptions<A, R>,
): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    const k = options.key(...args);
    const hit = options.cache.get(k);
    if (hit !== undefined) return hit;
    const result = await fn(...args);
    options.cache.set(k, result);
    return result;
  };
}
