/**
 * PII redaction (Feature 4 · safety). Deterministic regex sweep (no model call)
 * applied to user messages before they're persisted to memory or summarized —
 * the Lumina pattern. Replacement tokens are human-readable so the model still
 * reasons about message shape. Pure + tested.
 */

// Order matters: more-specific patterns (IPs, keys) run before the broad phone
// pattern so a dotted IP isn't mistaken for a phone number.
const PATTERNS: readonly { re: RegExp; token: string }[] = [
  { re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, token: '[email]' },
  { re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, token: '[aws-key]' },
  { re: /\b(?:sk|pk)-[A-Za-z0-9]{16,}\b/g, token: '[api-key]' },
  { re: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{16,}\b/g, token: '[token]' },
  { re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, token: '[ip]' },
  { re: /\+?\d[\d\s().-]{7,}\d/g, token: '[phone]' },
];

export interface RedactionResult {
  readonly text: string;
  readonly redactedCount: number;
}

export function redactPii(input: string): RedactionResult {
  let text = input;
  let count = 0;
  for (const { re, token } of PATTERNS) {
    text = text.replace(re, () => {
      count += 1;
      return token;
    });
  }
  return { text, redactedCount: count };
}
