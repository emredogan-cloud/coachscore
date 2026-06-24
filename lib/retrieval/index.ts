export type {
  Embedding,
  EmbeddingProvider,
  VectorRecord,
  SimilarityMatch,
  VectorStore,
} from './types';
export { dotProduct, magnitude, cosineSimilarity } from './similarity';
export { HashingEmbeddingProvider } from './embedding';
export { MemoryVectorStore } from './memory-store';
export { KnowledgeRetriever, type KnowledgeDoc } from './knowledge';
