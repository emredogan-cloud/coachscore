/**
 * Abuse-protection primitives (Phase 9). Pure helpers — disposable-email
 * detection + input-size guards — used by the fraud heuristics and submission
 * validation. The disposable-domain list is representative, not exhaustive
 * (extend as abuse patterns emerge).
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'trashmail.com',
  'yopmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'getnada.com',
]);

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0 || at === email.length - 1) return null;
  return email
    .slice(at + 1)
    .trim()
    .toLowerCase();
}

export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  return domain !== null && DISPOSABLE_DOMAINS.has(domain);
}

/** Reject oversized free-text before it reaches storage / the model. */
export function exceedsMaxLength(text: string, maxChars: number): boolean {
  return text.length > maxChars;
}
