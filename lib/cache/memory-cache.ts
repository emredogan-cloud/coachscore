/**
 * In-memory cache (Phase 8) with optional TTL + LRU eviction. The clock is
 * injectable so TTL behaviour is deterministic in tests. Backs the report /
 * percentile / snapshot caches; a Redis store can implement `CacheStore` for
 * cross-instance caching at scale.
 */

import type { CacheStore } from './types';

interface Entry<V> {
  readonly value: V;
  readonly expiresAt: number | null;
}

export interface MemoryCacheOptions {
  /** Max entries before least-recently-used eviction (0/undefined = unbounded). */
  readonly maxEntries?: number;
  /** Time-to-live in ms (undefined = no expiry). */
  readonly ttlMs?: number;
  readonly now?: () => number;
}

export class MemoryCache<V> implements CacheStore<V> {
  private readonly map = new Map<string, Entry<V>>();
  private readonly maxEntries: number;
  private readonly ttlMs: number | null;
  private readonly now: () => number;

  constructor(options: MemoryCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 0;
    this.ttlMs = options.ttlMs ?? null;
    this.now = options.now ?? (() => Date.now());
  }

  private isExpired(entry: Entry<V>): boolean {
    return entry.expiresAt !== null && this.now() >= entry.expiresAt;
  }

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (entry === undefined) return undefined;
    if (this.isExpired(entry)) {
      this.map.delete(key);
      return undefined;
    }
    // LRU touch: re-insert to move to the most-recent position.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    this.map.delete(key);
    this.map.set(key, {
      value,
      expiresAt: this.ttlMs === null ? null : this.now() + this.ttlMs,
    });
    if (this.maxEntries > 0 && this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
