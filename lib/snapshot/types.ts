/**
 * Snapshot domain types (Phase 3).
 *
 * A snapshot freezes a normalized account together with the engine/reference/KB
 * versions in force when it was captured (version locking), so a report can be
 * reproduced and adjudicated on facts. The hash is taken over the deterministic
 * `SnapshotContent` only — provenance (source, confidence, notes) travels with
 * the snapshot but does not change its identity, so the same account captured
 * two different ways shares one content hash (cache/dedup key).
 */

import type { Goal, NormalizedAccount } from '@/lib/core';

/** Which of the three intake paths produced this snapshot. */
export type IntakeSource = 'tag' | 'screenshot' | 'manual';

/** The versions a snapshot is locked against (deep-dive determinism contract). */
export interface VersionLock {
  readonly engineVersion: string;
  readonly referenceTableVersion: string;
  readonly knowledgeBaseVersion: string;
}

/** How the data was captured. Not part of the content hash. */
export interface SnapshotProvenance {
  readonly source: IntakeSource;
  /** 0..1 overall confidence in the captured data. */
  readonly confidence: number;
  /** Field keys the user still needs to confirm (e.g. low-confidence OCR). */
  readonly fieldsNeedingConfirmation: readonly string[];
  /** Optional free-form note (e.g. player tag, "manual entry"). */
  readonly note?: string;
}

/** The deterministic, hashed content of a snapshot. */
export interface SnapshotContent {
  readonly account: NormalizedAccount;
  readonly goal: Goal;
  readonly lock: VersionLock;
}

/** An immutable, version-locked account snapshot. */
export interface AccountSnapshot extends SnapshotContent {
  /** sha256 hex over the canonical `SnapshotContent`. */
  readonly snapshotHash: string;
  readonly provenance: SnapshotProvenance;
}
