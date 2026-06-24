/**
 * Offline hashing embedder (Phase 8). A deterministic, dependency-free
 * `EmbeddingProvider` that hashes tokens into a fixed-dimension, L2-normalized
 * vector. It is NOT semantic — it exists so the retrieval layer runs and is
 * tested with no vendor/key; a real semantic embedding provider implements the
 * same interface at activation (and re-indexes the corpus).
 */

import type { Embedding, EmbeddingProvider } from './types';

function hash32(token: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class HashingEmbeddingProvider implements EmbeddingProvider {
  constructor(readonly dimensions: number = 256) {}

  async embed(text: string): Promise<Embedding> {
    const vec = new Array<number>(this.dimensions).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const token of tokens) {
      const h = hash32(token);
      const bucket = h % this.dimensions;
      // Signed contribution so distinct tokens can cancel/reinforce.
      const sign = (h & 1) === 0 ? 1 : -1;
      vec[bucket]! += sign;
    }
    const mag = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
    return vec.map((x) => x / mag);
  }

  async embedBatch(texts: readonly string[]): Promise<Embedding[]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
