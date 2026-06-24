/**
 * Rate limiting (Phase 9). A fixed-window limiter behind a `RateLimiter`
 * interface so a Redis-backed limiter can drop in for multi-instance enforcement
 * at scale. The clock is injectable, so window/reset behaviour is deterministic
 * in tests. Pure in-memory logic — no I/O.
 */

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly limit: number;
  /** Epoch ms when the current window resets. */
  readonly resetAt: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export interface RateLimitOptions {
  readonly limit: number;
  readonly windowMs: number;
  readonly now?: () => number;
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<
    string,
    { count: number; windowStart: number }
  >();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(options: RateLimitOptions) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.now = options.now ?? (() => Date.now());
  }

  check(key: string): RateLimitResult {
    const t = this.now();
    const entry = this.hits.get(key);
    if (entry === undefined || t - entry.windowStart >= this.windowMs) {
      this.hits.set(key, { count: 1, windowStart: t });
      return {
        allowed: true,
        remaining: this.limit - 1,
        limit: this.limit,
        resetAt: t + this.windowMs,
      };
    }
    const resetAt = entry.windowStart + this.windowMs;
    if (entry.count >= this.limit) {
      return { allowed: false, remaining: 0, limit: this.limit, resetAt };
    }
    entry.count += 1;
    return {
      allowed: true,
      remaining: this.limit - entry.count,
      limit: this.limit,
      resetAt,
    };
  }
}
