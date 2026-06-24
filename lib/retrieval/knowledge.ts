/**
 * Knowledge retrieval layer (Phase 8) — RAG-ready grounding. Indexes documents
 * (the knowledge base now; the analyzed-account corpus later = the data moat)
 * via an `EmbeddingProvider` into a `VectorStore`, and retrieves the top-k most
 * similar passages for a query. Depends only on the interfaces, so it runs
 * offline with the hashing embedder + memory store and unchanged against a real
 * embedder + pgvector at activation.
 */

import type { EmbeddingProvider, SimilarityMatch, VectorStore } from './types';

export interface KnowledgeDoc {
  readonly id: string;
  readonly text: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export class KnowledgeRetriever {
  constructor(
    private readonly embedder: EmbeddingProvider,
    private readonly store: VectorStore,
  ) {}

  async index(docs: readonly KnowledgeDoc[]): Promise<void> {
    const vectors = await this.embedder.embedBatch(docs.map((d) => d.text));
    await this.store.upsert(
      docs.map((doc, i) => ({
        id: doc.id,
        vector: vectors[i]!,
        text: doc.text,
        metadata: doc.metadata,
      })),
    );
  }

  async retrieve(query: string, k = 3): Promise<SimilarityMatch[]> {
    const vector = await this.embedder.embed(query);
    return this.store.query(vector, k);
  }
}
