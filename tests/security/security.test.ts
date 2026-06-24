import { describe, expect, it } from 'vitest';
import {
  exceedsMaxLength,
  isDisposableEmail,
  emailDomain,
  MemoryRateLimiter,
  scoreFraud,
} from '@/lib/security';

describe('MemoryRateLimiter', () => {
  it('allows up to the limit then blocks within the window', () => {
    const t = 1000;
    const limiter = new MemoryRateLimiter({
      limit: 3,
      windowMs: 1000,
      now: () => t,
    });
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(true);
    const third = limiter.check('ip');
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
    expect(limiter.check('ip').allowed).toBe(false);
  });

  it('resets after the window elapses', () => {
    let t = 1000;
    const limiter = new MemoryRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => t,
    });
    expect(limiter.check('k').allowed).toBe(true);
    expect(limiter.check('k').allowed).toBe(false);
    t = 2001; // window elapsed
    expect(limiter.check('k').allowed).toBe(true);
  });

  it('tracks keys independently', () => {
    const limiter = new MemoryRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => 0,
    });
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });
});

describe('abuse helpers', () => {
  it('extracts domains and flags disposable email', () => {
    expect(emailDomain('a@b.com')).toBe('b.com');
    expect(emailDomain('nope')).toBeNull();
    expect(isDisposableEmail('x@mailinator.com')).toBe(true);
    expect(isDisposableEmail('x@gmail.com')).toBe(false);
  });

  it('guards oversized input', () => {
    expect(exceedsMaxLength('abc', 2)).toBe(true);
    expect(exceedsMaxLength('ab', 2)).toBe(false);
  });
});

describe('scoreFraud', () => {
  it('scores clean signals as low risk', () => {
    expect(scoreFraud({}).level).toBe('low');
  });

  it('flags self-referral as high risk with a reason', () => {
    const a = scoreFraud({ selfReferral: true });
    expect(a.level).toBe('high');
    expect(a.reasons).toContain('self_referral');
  });

  it('accumulates and caps the score', () => {
    const a = scoreFraud({
      selfReferral: true,
      disposableEmail: true,
      referralClaimsInLastDay: 99,
    });
    expect(a.score).toBe(100);
    expect(a.level).toBe('high');
  });

  it('classifies a single disposable-email signal as medium', () => {
    expect(scoreFraud({ disposableEmail: true }).level).toBe('medium');
  });
});
