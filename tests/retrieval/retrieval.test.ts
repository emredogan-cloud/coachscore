import { describe, expect, it } from 'vitest';
import {
  cosineSimilarity,
  HashingEmbeddingProvider,
  KnowledgeRetriever,
  MemoryVectorStore,
} from '@/lib/retrieval';

describe('cosineSimilarity', () => {
  it('is 1 for identical, 0 for orthogonal, -1 for opposite', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 6);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 6);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0); // zero-vector guard
  });
});

describe('HashingEmbeddingProvider', () => {
  it('is deterministic, normalized, and fixed-dimension', async () => {
    const embedder = new HashingEmbeddingProvider(64);
    const a = await embedder.embed('hero upgrade priority');
    const b = await embedder.embed('hero upgrade priority');
    expect(a).toEqual(b);
    expect(a).toHaveLength(64);
    const mag = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
    expect(mag).toBeCloseTo(1, 6);
  });
});

describe('MemoryVectorStore', () => {
  it('returns the nearest records by cosine, limited to k', async () => {
    const store = new MemoryVectorStore();
    await store.upsert([
      { id: 'x', vector: [1, 0, 0], text: 'x' },
      { id: 'y', vector: [0, 1, 0], text: 'y' },
      { id: 'z', vector: [0.9, 0.1, 0], text: 'z' },
    ]);
    const matches = await store.query([1, 0, 0], 2);
    expect(matches).toHaveLength(2);
    expect(matches[0]?.id).toBe('x');
    expect(matches[1]?.id).toBe('z');
    expect(await store.size()).toBe(3);
  });
});

describe('KnowledgeRetriever', () => {
  it('indexes docs and retrieves the most relevant passage first', async () => {
    const retriever = new KnowledgeRetriever(
      new HashingEmbeddingProvider(512),
      new MemoryVectorStore(),
    );
    await retriever.index([
      {
        id: 'heroes',
        text: 'hero levels equipment war attack strategy matter most',
      },
      {
        id: 'walls',
        text: 'walls trophy farming resource storage defense layout',
      },
    ]);
    const matches = await retriever.retrieve('hero war attack', 2);
    expect(matches[0]?.id).toBe('heroes');
    expect(matches[0]!.score).toBeGreaterThan(matches[1]!.score);
  });
});
