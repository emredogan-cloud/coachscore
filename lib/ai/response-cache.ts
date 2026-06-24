/**
 * Response caching (Phase 8). A `CachingProvider` decorates any `AiProvider`:
 * identical requests (same model + system + messages + tool) are served from a
 * pluggable cache without an API call — the roadmap's "re-analysis after no
 * change is free". Invalidation is by content hash (inputs change ⇒ key changes)
 * + a global version bump. The default store is in-memory; a Redis-backed store
 * implements the same async interface at activation.
 */

import type { AiProvider, GenerateOptions, ProviderResponse } from './types';

/** Bump to invalidate every cached response (e.g. prompt/format changes). */
export const RESPONSE_CACHE_VERSION = '1';

function hashKey(input: string): string {
  // FNV-1a over two interleaved lanes → 16 hex chars (low collision for cache keys).
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x01000193);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return hex(h1) + hex(h2);
}

export function responseCacheKey(options: GenerateOptions): string {
  const shape = JSON.stringify({
    v: RESPONSE_CACHE_VERSION,
    model: options.model,
    system: options.system,
    messages: options.messages,
    maxTokens: options.maxTokens,
    tool: options.tool?.name ?? null,
    toolSchema: options.tool?.inputSchema ?? null,
    images:
      options.images?.map((i) => `${i.mediaType}:${i.dataBase64.length}`) ??
      null,
  });
  return hashKey(shape);
}

export interface ResponseCache {
  get(key: string): Promise<ProviderResponse | undefined>;
  set(key: string, value: ProviderResponse): Promise<void>;
}

export class MemoryResponseCache implements ResponseCache {
  private readonly map = new Map<string, ProviderResponse>();
  async get(key: string): Promise<ProviderResponse | undefined> {
    return this.map.get(key);
  }
  async set(key: string, value: ProviderResponse): Promise<void> {
    this.map.set(key, value);
  }
  /** Explicit invalidation. */
  clear(): void {
    this.map.clear();
  }
  get size(): number {
    return this.map.size;
  }
}

export class CachingProvider implements AiProvider {
  constructor(
    private readonly inner: AiProvider,
    private readonly cache: ResponseCache,
  ) {}

  async generate(options: GenerateOptions): Promise<ProviderResponse> {
    const key = responseCacheKey(options);
    const hit = await this.cache.get(key);
    if (hit !== undefined) {
      // Cache hit ⇒ no API call ⇒ zero marginal token cost.
      return {
        ...hit,
        cached: true,
        usage: { inputTokens: 0, outputTokens: 0 },
      };
    }
    const response = await this.inner.generate(options);
    await this.cache.set(key, response);
    return response;
  }
}
