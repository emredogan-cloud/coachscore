/**
 * Deterministic experiment/flag bucketing (Phase 7).
 *
 * Assignment is a pure function of (key, subjectId) via a stable 32-bit FNV-1a
 * hash → a fraction in [0,1). No randomness, no clock — the same subject always
 * lands in the same variant ("sticky" assignment) without storing anything,
 * which also means assignment reconciles across server restarts and instances.
 */

import type { Experiment, FeatureFlag } from './types';

/** Stable hash of a string → fraction in [0, 1). FNV-1a (32-bit). */
export function hashFraction(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}

/** Deterministically assign a subject to one of an experiment's variants. */
export function assignVariant(
  experiment: Experiment,
  subjectId: string,
): string {
  const variants = experiment.variants;
  if (variants.length === 0) {
    throw new Error(`Experiment "${experiment.key}" has no variants.`);
  }
  const total = variants.reduce((sum, v) => sum + Math.max(0, v.weight), 0);
  if (total <= 0) return variants[0]!.key;

  const target = hashFraction(`${experiment.key}:${subjectId}`) * total;
  let cumulative = 0;
  for (const v of variants) {
    cumulative += Math.max(0, v.weight);
    if (target < cumulative) return v.key;
  }
  return variants[variants.length - 1]!.key;
}

/** Evaluate a feature flag for a subject (deterministic percentage rollout). */
export function evaluateFlag(flag: FeatureFlag, subjectId: string): boolean {
  if (!flag.enabled) return false;
  if (flag.rolloutPct >= 100) return true;
  if (flag.rolloutPct <= 0) return false;
  return hashFraction(`flag:${flag.key}:${subjectId}`) * 100 < flag.rolloutPct;
}
