/**
 * Stripe-compatible webhook signature verification (Phase 4). Pure crypto
 * (HMAC-SHA256 over `${timestamp}.${payload}`, timing-safe compare, timestamp
 * tolerance) so order state can ONLY be advanced by genuine, recent Stripe
 * events. `nowSec` is injectable for deterministic tests.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SignatureCheck {
  readonly ok: boolean;
  readonly reason?: string;
}

/** HMAC-SHA256 hex of `${timestamp}.${payload}` keyed by the webhook secret. */
export function computeSignature(
  payload: string,
  timestamp: string,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
}

export function verifyWebhookSignature(
  payload: string,
  header: string,
  secret: string,
  opts: { toleranceSec?: number; nowSec?: number } = {},
): SignatureCheck {
  const tolerance = opts.toleranceSec ?? 300;
  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 't') timestamp = value;
    else if (key === 'v1') signatures.push(value);
  }
  if (timestamp === undefined || signatures.length === 0) {
    return { ok: false, reason: 'malformed signature header' };
  }

  const expected = Buffer.from(
    computeSignature(payload, timestamp, secret),
    'hex',
  );
  const matched = signatures.some((sig) => {
    const candidate = Buffer.from(sig, 'hex');
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  });
  if (!matched) return { ok: false, reason: 'signature mismatch' };

  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > tolerance) {
    return { ok: false, reason: 'timestamp outside tolerance' };
  }
  return { ok: true };
}
