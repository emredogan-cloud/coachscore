/**
 * Cache key builders (Phase 8). Keys encode every input that affects the cached
 * value so invalidation is automatic: a new reference-table version, goal, or
 * snapshot hash yields a new key. Matches the roadmap's "(snapshot_hash, goal,
 * table_version)" caching contract — re-analysis after no change is free.
 */

export function reportCacheKey(
  snapshotHash: string,
  goal: string,
  referenceTableVersion: string,
): string {
  return `report:${referenceTableVersion}:${goal}:${snapshotHash}`;
}

export function scoreCacheKey(
  snapshotHash: string,
  goal: string,
  referenceTableVersion: string,
): string {
  return `score:${referenceTableVersion}:${goal}:${snapshotHash}`;
}

export function percentileCacheKey(
  townHall: number,
  referenceTableVersion: string,
): string {
  return `percentile:${referenceTableVersion}:th${townHall}`;
}

export function snapshotCacheKey(snapshotHash: string): string {
  // Snapshots are immutable, so the hash alone is a stable, permanent key.
  return `snapshot:${snapshotHash}`;
}
