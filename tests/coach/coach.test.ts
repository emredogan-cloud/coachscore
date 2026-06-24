import { describe, expect, it } from 'vitest';
import { InvalidTransitionError } from '@/lib/fsm';
import {
  applicationMachine,
  coachStatusMachine,
  isSpecialty,
  parseSpecialties,
  summarizeRatings,
  validateCoachProfile,
} from '@/lib/coach';

describe('coach status lifecycle', () => {
  it('allows the happy path and blocks illegal moves', () => {
    expect(coachStatusMachine.can('applied', 'under_review')).toBe(true);
    expect(coachStatusMachine.can('under_review', 'approved')).toBe(true);
    expect(coachStatusMachine.can('approved', 'active')).toBe(true);
    expect(coachStatusMachine.can('rejected', 'active')).toBe(false);
    expect(coachStatusMachine.isTerminal('deactivated')).toBe(true);
    expect(() => coachStatusMachine.assert('active', 'applied')).toThrow(
      InvalidTransitionError,
    );
  });
  it('application machine: pending → approved/rejected, then terminal', () => {
    expect(applicationMachine.can('pending', 'approved')).toBe(true);
    expect(applicationMachine.isTerminal('approved')).toBe(true);
    expect(applicationMachine.isTerminal('rejected')).toBe(true);
  });
});

describe('specialties', () => {
  it('validates and normalizes (drop unknown, dedupe, catalog order)', () => {
    expect(isSpecialty('war')).toBe(true);
    expect(isSpecialty('nonsense')).toBe(false);
    expect(parseSpecialties(['trophy', 'war', 'nope', 'war'])).toEqual([
      'war',
      'trophy',
    ]);
    expect(parseSpecialties([])).toEqual([]);
  });
});

describe('reputation', () => {
  it('Bayesian-damps toward the prior for few ratings', () => {
    const none = summarizeRatings([]);
    expect(none.count).toBe(0);
    expect(none.average).toBe(0);
    expect(none.reputationScore).toBe(80); // prior mean 4.0 → 80

    const strong = summarizeRatings([5, 5, 5]);
    expect(strong.count).toBe(3);
    expect(strong.average).toBe(5);
    expect(strong.reputationScore).toBe(88); // (20+15)/8 = 4.375 → 88

    expect(summarizeRatings([1]).reputationScore).toBe(70); // (20+1)/6 = 3.5 → 70
  });

  it('clamps out-of-range stars', () => {
    expect(summarizeRatings([9, -3]).average).toBe(3); // clamped to 5 and 1
  });
});

describe('coach profile validation', () => {
  it('accepts a valid profile and normalizes it', () => {
    const result = validateCoachProfile({
      displayName: '  WarCoach  ',
      bio: 'I have coached top war clans for five years and counting.',
      specialties: ['war', 'bogus', 'equipment'],
      hourlyRateCents: 5000,
      weeklyCapacity: 8,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.displayName).toBe('WarCoach');
      expect(result.value.specialties).toEqual(['war', 'equipment']);
      expect(result.value.availability.weeklyCapacity).toBe(8);
    }
  });

  it('rejects an empty/short profile with errors', () => {
    const result = validateCoachProfile({
      displayName: 'x',
      bio: 'too short',
      specialties: ['bogus'],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
