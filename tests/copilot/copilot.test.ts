import { describe, expect, it } from 'vitest';
import {
  buildCopilotSystemPrompt,
  checkRateLimit,
  COPILOT_LIMITS,
} from '@/lib/copilot';

describe('buildCopilotSystemPrompt — grounding + anti-hallucination', () => {
  const prompt = buildCopilotSystemPrompt();

  it('declares the anti-fabrication rule', () => {
    expect(prompt).toMatch(/NEVER invent/i);
    expect(prompt).toMatch(/deterministic/i);
  });

  it('grounds in real, data-derived product facts (not invented)', () => {
    // Verified TH18 hero cap from the reference table.
    expect(prompt).toContain('Barbarian King 110');
    // Real public pricing.
    expect(prompt).toContain('Premium Report');
    expect(prompt).toContain('$7');
    // The 7 dimensions + grade scale.
    expect(prompt).toMatch(/heroes/);
    expect(prompt).toContain('Supported Town Halls: 11–18');
  });

  it('sets scope + honesty guardrails', () => {
    expect(prompt).toMatch(/Clash of Clans/);
    expect(prompt).toMatch(/screenshot/i); // honest about defense/walls limit
  });
});

describe('checkRateLimit — cost control', () => {
  it('allows up to the window cap then blocks', () => {
    const store = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < COPILOT_LIMITS.maxPerWindow; i++) {
      expect(checkRateLimit('ip1', now, store).allowed).toBe(true);
    }
    const blocked = checkRateLimit('ip1', now, store);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets after the window elapses', () => {
    const store = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < COPILOT_LIMITS.maxPerWindow; i++) {
      checkRateLimit('ip2', now, store);
    }
    expect(checkRateLimit('ip2', now, store).allowed).toBe(false);
    expect(
      checkRateLimit('ip2', now + COPILOT_LIMITS.windowMs + 1, store).allowed,
    ).toBe(true);
  });

  it('isolates keys', () => {
    const store = new Map<string, number[]>();
    expect(checkRateLimit('a', 5, store).allowed).toBe(true);
    expect(checkRateLimit('b', 5, store).allowed).toBe(true);
  });
});
