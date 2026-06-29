/**
 * Creator-code foundations (Wave 10 — growth infrastructure).
 *
 * A creator code is a vanity referral code a partnered creator gets (e.g.
 * "JUDOSLOTH") — distinct from the auto-generated per-user referral codes
 * (CS······). This is the FOUNDATION only: a typed registry + format validation
 * + resolver, wired into the /r/{code} landing so creator links attribute. The
 * registry seeds empty (creators are added at partnership time, or moved to the
 * DB later) — no fake creators. Pure + testable; no external campaigns here.
 */

export interface CreatorCode {
  /** Normalized (uppercase) vanity code. */
  readonly code: string;
  /** The creator's handle, for attribution/reporting. */
  readonly handle: string;
}

/** Seed registry — intentionally empty until real partnerships exist. */
export const CREATOR_CODES: readonly CreatorCode[] = [];

const CODE_RE = /^[A-Z0-9]{3,16}$/;

export function normalizeCreatorCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Plausible vanity-code shape (not necessarily a registered one). */
export function isCreatorCodeFormat(raw: string): boolean {
  return CODE_RE.test(normalizeCreatorCode(raw));
}

/** Resolve a REGISTERED creator code, or null. Registry is injectable for tests. */
export function resolveCreatorCode(
  raw: string,
  registry: readonly CreatorCode[] = CREATOR_CODES,
): CreatorCode | null {
  const code = normalizeCreatorCode(raw);
  return registry.find((c) => c.code === code) ?? null;
}
