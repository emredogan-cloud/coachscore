import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import {
  createSnapshot,
  currentVersionLock,
  deserializeSnapshot,
  hashContent,
  scoreSnapshot,
  serializeSnapshot,
  SnapshotIntegrityError,
  stableStringify,
  verifySnapshot,
} from '@/lib/snapshot';
import type { SnapshotProvenance } from '@/lib/snapshot';
import { TH14_WAR_EXAMPLE } from '../core/fixtures';

const provenance: SnapshotProvenance = {
  source: 'manual',
  confidence: 1,
  fieldsNeedingConfirmation: [],
  note: 'test',
};

describe('stableStringify', () => {
  it('sorts object keys recursively so equal values stringify identically', () => {
    const a = stableStringify({ b: 1, a: { d: 2, c: 3 } });
    const b = stableStringify({ a: { c: 3, d: 2 }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it('preserves array order and passes primitives through', () => {
    expect(stableStringify([3, 1, 2])).toBe('[3,1,2]');
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify(7)).toBe('7');
  });

  it('hashContent is stable and differs on different content', () => {
    expect(hashContent({ a: 1 })).toBe(hashContent({ a: 1 }));
    expect(hashContent({ a: 1 })).not.toBe(hashContent({ a: 2 }));
  });
});

describe('createSnapshot', () => {
  it('produces a deterministic hash for identical content', () => {
    const s1 = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    const s2 = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    expect(s1.snapshotHash).toBe(s2.snapshotHash);
    expect(verifySnapshot(s1)).toBe(true);
  });

  it('changes the hash when the goal changes', () => {
    const war = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    const trophy = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'trophy',
      provenance,
    });
    expect(war.snapshotHash).not.toBe(trophy.snapshotHash);
  });

  it('does NOT fold provenance into the content hash (same content → same hash)', () => {
    const a = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    const b = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance: {
        ...provenance,
        source: 'tag',
        confidence: 0.4,
        note: 'other',
      },
    });
    expect(a.snapshotHash).toBe(b.snapshotHash);
  });

  it('changes the hash when the version lock changes', () => {
    const current = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    const locked = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
      lock: { ...currentVersionLock(), engineVersion: '9.9.9' },
    });
    expect(current.snapshotHash).not.toBe(locked.snapshotHash);
  });

  it('deep-freezes the snapshot so it cannot mutate after capture', () => {
    const s = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.lock)).toBe(true);
    expect(Object.isFrozen(s.account)).toBe(true);
  });
});

describe('serialize / deserialize', () => {
  it('round-trips and preserves the hash', () => {
    const s = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    const back = deserializeSnapshot(serializeSnapshot(s));
    expect(back.snapshotHash).toBe(s.snapshotHash);
    expect(verifySnapshot(back)).toBe(true);
    expect(Object.isFrozen(back)).toBe(true);
  });

  it('throws on a tampered snapshot', () => {
    const s = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    const tampered = JSON.parse(serializeSnapshot(s)) as { goal: string };
    tampered.goal = 'trophy';
    expect(() => deserializeSnapshot(JSON.stringify(tampered))).toThrow(
      SnapshotIntegrityError,
    );
  });
});

describe('scoreSnapshot', () => {
  it('reproduces the engine result for the snapshotted account + goal', () => {
    const s = createSnapshot({
      account: TH14_WAR_EXAMPLE,
      goal: 'war',
      provenance,
    });
    const fromSnapshot = scoreSnapshot(s);
    const direct = computeCoachScore(TH14_WAR_EXAMPLE, 'war');
    expect(fromSnapshot.overallRounded).toBe(direct.overallRounded);
    expect(fromSnapshot.grade).toBe(direct.grade);
    expect(fromSnapshot.gaps.map((g) => g.id)).toEqual(
      direct.gaps.map((g) => g.id),
    );
  });
});
