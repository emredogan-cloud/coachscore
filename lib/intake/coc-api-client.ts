/**
 * Production Clash of Clans API client (PMF-correction sprint — Phase 3).
 *
 * Implements the `CocApiAdapter` contract with a real HTTP client behind the
 * RoyaleAPI fixed-IP proxy (the only way to use an IP-whitelisted token from
 * Vercel's rotating egress IPs). Built for production:
 *   - caching (player progression changes slowly; default 120s TTL, serve-stale-on-error)
 *   - retries with exponential backoff + jitter, honoring `retry-after`
 *   - rate limiting (token bucket; the API throttles ~10 req/token/s)
 *   - validation (zod at the network boundary — see coc-api-schema.ts)
 *   - graceful, typed errors (404 not-found, 403 misconfig, 429 throttle, 5xx)
 *
 * Activation: set COC_API_TOKEN (whitelisted to the proxy IP) + COC_API_PROXY_URL.
 * Until then `createCocAdapter()` returns the NotConfigured adapter and the tag
 * path degrades cleanly to "not activated" (the UI falls back to manual entry).
 * Everything is injectable (fetch/sleep/clock/cache/limiter) so it unit-tests
 * with no network and no real timers. See SUPERCELL_API_ACTIVATION_REPORT.md.
 */

import { isCocApiConfigured } from '@/lib/activation';
import {
  CocApiNotConfiguredError,
  NotConfiguredCocAdapter,
  parsePlayerTag,
  type CocAccountData,
  type CocApiAdapter,
} from './coc-adapter';
import { CocErrorSchema, CocPlayerSchema } from './coc-api-schema';
import { mapCocPlayerToFields } from './coc-mapper';

/** The requested player tag does not exist (HTTP 404). Not retryable. */
export class CocPlayerNotFoundError extends Error {
  constructor(tag: string) {
    super(`No Clash of Clans player found for tag ${tag}.`);
    this.name = 'CocPlayerNotFoundError';
  }
}

/** Token/IP rejected (HTTP 403) — a server-side misconfiguration, not the user's. */
export class CocApiAccessError extends Error {
  constructor(message = 'Clash of Clans API access denied (token or IP).') {
    super(message);
    this.name = 'CocApiAccessError';
  }
}

/** Transient upstream failure (throttle / 5xx / maintenance / network). Retryable. */
export class CocApiUnavailableError extends Error {
  constructor(message = 'The Clash of Clans API is temporarily unavailable.') {
    super(message);
    this.name = 'CocApiUnavailableError';
  }
}

type FetchImpl = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

interface CacheEntry {
  readonly data: CocAccountData;
  readonly at: number;
}

/** Minimal token-bucket limiter; refills at `ratePerSec`, capped at `burst`. */
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(
    private readonly ratePerSec = 8,
    private readonly burst = 8,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep,
  ) {
    this.tokens = burst;
    this.last = now();
  }
  async acquire(): Promise<void> {
    for (;;) {
      const now = this.now();
      this.tokens = Math.min(
        this.burst,
        this.tokens + ((now - this.last) / 1000) * this.ratePerSec,
      );
      this.last = now;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await this.sleep(Math.ceil(1000 / this.ratePerSec));
    }
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ProxyCocAdapterOptions {
  readonly token: string;
  /** Proxy/base origin, e.g. https://cocproxy.royaleapi.dev (with or without /v1). */
  readonly baseUrl: string;
  readonly fetchImpl?: FetchImpl;
  readonly cacheTtlMs?: number;
  readonly maxRetries?: number;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly limiter?: { acquire(): Promise<void> };
}

/** Resolve the players endpoint base, tolerating a trailing `/v1` or slash. */
function playersBase(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')}/v1`;
}

export class ProxyCocAdapter implements CocApiAdapter {
  private readonly token: string;
  private readonly base: string;
  private readonly fetchImpl: FetchImpl;
  private readonly cacheTtlMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly limiter: { acquire(): Promise<void> };
  private readonly cache = new Map<string, CacheEntry>();

  constructor(opts: ProxyCocAdapterOptions) {
    this.token = opts.token;
    this.base = playersBase(opts.baseUrl);
    this.fetchImpl =
      opts.fetchImpl ?? (globalThis.fetch as unknown as FetchImpl);
    this.cacheTtlMs = opts.cacheTtlMs ?? 120_000;
    this.maxRetries = opts.maxRetries ?? 3;
    this.timeoutMs = opts.timeoutMs ?? 8_000;
    this.now = opts.now ?? Date.now;
    this.sleep = opts.sleep ?? defaultSleep;
    this.limiter = opts.limiter ?? new TokenBucket(8, 8, this.now, this.sleep);
  }

  async fetchAccount(rawTag: string): Promise<CocAccountData> {
    const tag = parsePlayerTag(rawTag); // throws InvalidPlayerTagError
    const fresh = this.cache.get(tag);
    if (fresh && this.now() - fresh.at < this.cacheTtlMs) return fresh.data;

    const url = `${this.base}/players/${encodeURIComponent(tag)}`;
    let lastError: Error = new CocApiUnavailableError();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) await this.sleep(this.backoffMs(attempt));
      await this.limiter.acquire();
      try {
        const result = await this.attempt(url, tag);
        if (result.kind === 'ok') {
          const entry = { data: result.data, at: this.now() };
          this.cache.set(tag, entry);
          return result.data;
        }
        if (result.kind === 'fatal') throw result.error;
        lastError = result.error; // retryable
      } catch (err) {
        if (
          err instanceof CocPlayerNotFoundError ||
          err instanceof CocApiAccessError
        ) {
          throw err;
        }
        // Network/abort/parse error → retryable.
        lastError =
          err instanceof Error ? err : new CocApiUnavailableError(String(err));
      }
    }
    // Exhausted retries — serve stale cache if we have any, else surface.
    if (fresh) return fresh.data;
    throw lastError;
  }

  private backoffMs(attempt: number): number {
    // Exponential (250ms·2^n) with deterministic-ish jitter from the attempt.
    const base = 250 * 2 ** (attempt - 1);
    return Math.min(4_000, base) + ((attempt * 53) % 120);
  }

  private async attempt(
    url: string,
    tag: string,
  ): Promise<
    | { kind: 'ok'; data: CocAccountData }
    | { kind: 'retry'; error: Error }
    | { kind: 'fatal'; error: Error }
  > {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (res.ok) {
        const json = await res.json();
        const player = CocPlayerSchema.parse(json);
        return {
          kind: 'ok',
          data: { playerTag: tag, fields: mapCocPlayerToFields(player) },
        };
      }

      if (res.status === 404) {
        return { kind: 'fatal', error: new CocPlayerNotFoundError(tag) };
      }
      if (res.status === 403) {
        return { kind: 'fatal', error: new CocApiAccessError() };
      }
      // 429 / 500 / 503 / other → retryable transient.
      const reason = await this.readReason(res);
      return {
        kind: 'retry',
        error: new CocApiUnavailableError(
          `Clash of Clans API responded ${res.status}${reason ? ` (${reason})` : ''}.`,
        ),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async readReason(res: {
    json(): Promise<unknown>;
  }): Promise<string | null> {
    try {
      const parsed = CocErrorSchema.safeParse(await res.json());
      return parsed.success ? parsed.data.reason : null;
    } catch {
      return null;
    }
  }
}

/**
 * The default adapter for the running app: the real proxy client when the CoC
 * API credentials are present, otherwise the NotConfigured stub (so the tag path
 * degrades cleanly and the UI offers manual entry).
 */
export function createCocAdapter(): CocApiAdapter {
  if (!isCocApiConfigured()) return new NotConfiguredCocAdapter();
  const token = process.env.COC_API_TOKEN as string;
  const baseUrl = process.env.COC_API_PROXY_URL as string;
  try {
    return new ProxyCocAdapter({ token, baseUrl });
  } catch {
    return new NotConfiguredCocAdapter();
  }
}

export { CocApiNotConfiguredError };
