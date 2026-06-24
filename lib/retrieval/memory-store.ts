/**
 * In-memory vector store (Phase 8). Brute-force cosine search over upserted
 * records — sufficient for the knowledge base + tests. The pgvector-backed store
 * implements the same `VectorStore` interface (ivfflat/hnsw index) at activation
 * for the at-scale account corpus.
 */

import { cosineSimilarity } from './similarity';
import type {
  Embedding,
  SimilarityMatch,
  VectorRecord,
  VectorStore,
} from './types';

export class MemoryVectorStore implements VectorStore {
  private readonly records = new Map<string, VectorRecord>();

  async upsert(records: readonly VectorRecord[]): Promise<void> {
    for (const record of records) this.records.set(record.id, record);
  }

  async query(vector: Embedding, k: number): Promise<SimilarityMatch[]> {
    return [...this.records.values()]
      .map(
        (r): SimilarityMatch => ({
          id: r.id,
          text: r.text,
          score: cosineSimilarity(vector, r.vector),
          metadata: r.metadata,
        }),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(0, k));
  }

  async size(): Promise<number> {
    return this.records.size;
  }
}
