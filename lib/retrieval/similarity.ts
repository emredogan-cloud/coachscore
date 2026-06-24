/**
 * Vector similarity (Phase 8). Pure cosine similarity + ranking — the math
 * pgvector runs in-database at activation, kept here so the in-memory store and
 * tests share one definition.
 */

import type { Embedding } from './types';

export function dotProduct(a: Embedding, b: Embedding): number {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += a[i]! * b[i]!;
  return sum;
}

export function magnitude(a: Embedding): number {
  return Math.sqrt(dotProduct(a, a));
}

export function cosineSimilarity(a: Embedding, b: Embedding): number {
  const denom = magnitude(a) * magnitude(b);
  return denom === 0 ? 0 : dotProduct(a, b) / denom;
}
