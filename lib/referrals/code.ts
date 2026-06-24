/**
 * Referral code generation (Phase 7). Creator-code style — short, uppercase,
 * unambiguous (no 0/O/1/I/L), prefixed `CS`. Generated from a stable hash of a
 * seed (the user id, plus a salt the service bumps on the rare collision), so a
 * user keeps one memorable code. Pure; the service owns uniqueness.
 */

// Crockford-ish alphabet minus ambiguous characters.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;
const CODE_RE = /^CS[2-9A-HJ-NP-Z]{6}$/;

function hash32(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function generateReferralCode(seed: string): string {
  let n = hash32(seed);
  let body = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    body += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length);
  }
  return `CS${body}`;
}

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidReferralCode(raw: string): boolean {
  return CODE_RE.test(normalizeReferralCode(raw));
}
