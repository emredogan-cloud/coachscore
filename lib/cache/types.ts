/**
 * Cache abstraction (Phase 8). A tiny synchronous key/value store interface so
 * the memoization layer + report/percentile/snapshot caches stay swappable (an
 * in-memory LRU now; a Redis-backed store implements the same shape later).
 */

export interface CacheStore<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  readonly size: number;
}
