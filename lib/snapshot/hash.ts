/**
 * Deterministic content hashing for snapshots.
 *
 * `stableStringify` produces canonical JSON (object keys sorted recursively,
 * array order preserved) so the same logical value always hashes identically
 * regardless of key insertion order. Pure: no clock, no randomness.
 */

import { createHash } from 'node:crypto';

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalize(obj[key]);
  }
  return sorted;
}

/** Canonical JSON string: keys sorted recursively, arrays preserved. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/** sha256 hex digest of the canonical form of `value`. */
export function hashContent(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}
