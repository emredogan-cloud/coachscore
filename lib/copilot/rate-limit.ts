/**
 * Copilot rate limiting + cost caps (COPILOT-P0 production control).
 *
 * The reference Lumina assistant has NO rate limit or cost cap on its chat route
 * — a gap a paid product must close. This is a per-key (IP/session) sliding
 * window plus hard caps on message count, message size, and tokens-per-turn, so
 * a single visitor can't run up the AI bill. In-memory (per serverless instance)
 * — good enough to blunt abuse; swap in Redis for multi-instance precision.
 * Pure + injectable (store + clock) so it unit-tests deterministically.
 */

export const COPILOT_LIMITS = {
  windowMs: 60_000,
  maxPerWindow: 15,
  /** Max conversation turns accepted in one request (cost cap). */
  maxMessages: 24,
  /** Max characters per message (cost cap). */
  maxCharsPerMessage: 2_000,
  /** Max output tokens per turn (cost cap). */
  maxTokensPerTurn: 700,
} as const;

const defaultStore = new Map<string, number[]>();

export interface RateResult {
  readonly allowed: boolean;
  readonly retryAfterMs: number;
}

/** Sliding-window check. Records the hit when allowed. */
export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  store: Map<string, number[]> = defaultStore,
): RateResult {
  const { windowMs, maxPerWindow } = COPILOT_LIMITS;
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= maxPerWindow) {
    const oldest = recent[0] ?? now;
    return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
  }
  recent.push(now);
  store.set(key, recent);
  return { allowed: true, retryAfterMs: 0 };
}
