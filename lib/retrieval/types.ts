/**
 * Retrieval / data-moat abstractions (Phase 8). pgvector-ready interfaces for
 * embeddings + a vector store + similarity search, so the knowledge-retrieval
 * (RAG) layer that grounds the AI can index the knowledge base and, at scale,
 * the corpus of analyzed accounts — the data moat. No new vendor: the vector
 * store maps to pgvector inside the existing Supabase Postgres; the offline
 * embedder needs nothing.
 */

export type Embedding = readonly number[];

/** Produces vectors for text. A real semantic provider activates later; the
 *  hashing provider runs offline with zero dependencies. */
export interface EmbeddingProvider {
  embed(text: string): Promise<Embedding>;
  embedBatch(texts: readonly string[]): Promise<Embedding[]>;
  readonly dimensions: number;
}

export interface VectorRecord {
  readonly id: string;
  readonly vector: Embedding;
  readonly text: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SimilarityMatch {
  readonly id: string;
  readonly text: string;
  readonly score: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Vector store boundary — in-memory now, pgvector at activation. */
export interface VectorStore {
  upsert(records: readonly VectorRecord[]): Promise<void>;
  query(vector: Embedding, k: number): Promise<SimilarityMatch[]>;
  size(): Promise<number>;
}
