/**
 * Immutable, version-locked account snapshots (Phase 3).
 *
 * Snapshots are how the deterministic scoring engine is fed reproducibly: a
 * snapshot freezes the normalized account + goal + the engine/reference/KB
 * versions, hashes that content, and is deep-frozen so it cannot mutate after
 * capture. `scoreSnapshot` is the engine's snapshot entry point.
 */

import { computeCoachScore, ENGINE_VERSION } from '@/lib/core';
import type { CoachScoreResult, Goal, NormalizedAccount } from '@/lib/core';
import { GAME_DATA_REFERENCE } from '@/lib/game-data';
import { KNOWLEDGE_BASE_VERSION } from '@/lib/ai';
import { hashContent } from './hash';
import type {
  AccountSnapshot,
  SnapshotContent,
  SnapshotProvenance,
  VersionLock,
} from './types';

/** Raised when a snapshot's stored hash does not match its content. */
export class SnapshotIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotIntegrityError';
  }
}

/** The versions currently in force, used to lock a freshly captured snapshot. */
export function currentVersionLock(): VersionLock {
  return {
    engineVersion: ENGINE_VERSION,
    referenceTableVersion: GAME_DATA_REFERENCE.version,
    knowledgeBaseVersion: KNOWLEDGE_BASE_VERSION,
  };
}

/** Recursively freeze an object graph so a captured snapshot cannot mutate. */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

export interface CreateSnapshotInput {
  readonly account: NormalizedAccount;
  readonly goal: Goal;
  readonly provenance: SnapshotProvenance;
  /** Override the version lock (defaults to the current versions). */
  readonly lock?: VersionLock;
}

/** Capture an immutable, hashed, version-locked snapshot. */
export function createSnapshot(input: CreateSnapshotInput): AccountSnapshot {
  const lock = input.lock ?? currentVersionLock();
  const content: SnapshotContent = {
    account: input.account,
    goal: input.goal,
    lock,
  };
  const snapshotHash = hashContent(content);
  return deepFreeze({
    ...content,
    snapshotHash,
    provenance: input.provenance,
  });
}

/** True iff the snapshot's hash matches a fresh hash of its content. */
export function verifySnapshot(snapshot: AccountSnapshot): boolean {
  const content: SnapshotContent = {
    account: snapshot.account,
    goal: snapshot.goal,
    lock: snapshot.lock,
  };
  return hashContent(content) === snapshot.snapshotHash;
}

export function serializeSnapshot(snapshot: AccountSnapshot): string {
  return JSON.stringify(snapshot);
}

/** Parse + integrity-check a serialized snapshot; throws on tampering. */
export function deserializeSnapshot(json: string): AccountSnapshot {
  const parsed = JSON.parse(json) as AccountSnapshot;
  if (!verifySnapshot(parsed)) {
    throw new SnapshotIntegrityError(
      'Snapshot hash does not match its content (possible tampering or version skew).',
    );
  }
  return deepFreeze(parsed);
}

/**
 * The scoring engine consuming a snapshot. Reproducible: the same snapshot
 * always yields the same result (the engine is pure; ADR 0003).
 */
export function scoreSnapshot(snapshot: AccountSnapshot): CoachScoreResult {
  return computeCoachScore(snapshot.account, snapshot.goal);
}
