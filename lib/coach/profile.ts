/**
 * Coach profile validation/normalization (Phase 5). Pure: turns untrusted
 * application input into a normalized profile (trimmed, valid specialties,
 * availability) or a list of errors.
 */

import { parseSpecialties, type Specialty } from './specialties';

const MIN_NAME = 2;
const MAX_NAME = 60;
const MIN_BIO = 20;
const MAX_BIO = 2000;

export interface CoachAvailability {
  readonly acceptingWork: boolean;
  readonly weeklyCapacity: number;
}

export interface CoachProfileInput {
  readonly displayName: string;
  readonly bio: string;
  readonly specialties: readonly string[];
  readonly hourlyRateCents?: number | null;
  readonly acceptingWork?: boolean;
  readonly weeklyCapacity?: number;
}

export interface NormalizedCoachProfile {
  readonly displayName: string;
  readonly bio: string;
  readonly specialties: readonly Specialty[];
  readonly hourlyRateCents: number | null;
  readonly availability: CoachAvailability;
}

export type ProfileValidation =
  | { readonly ok: true; readonly value: NormalizedCoachProfile }
  | { readonly ok: false; readonly errors: readonly string[] };

export function validateCoachProfile(
  input: CoachProfileInput,
): ProfileValidation {
  const errors: string[] = [];
  const displayName = input.displayName.trim();
  if (displayName.length < MIN_NAME || displayName.length > MAX_NAME) {
    errors.push(`displayName must be ${MIN_NAME}–${MAX_NAME} characters.`);
  }
  const bio = input.bio.trim();
  if (bio.length < MIN_BIO || bio.length > MAX_BIO) {
    errors.push(`bio must be ${MIN_BIO}–${MAX_BIO} characters.`);
  }
  const specialties = parseSpecialties(input.specialties);
  if (specialties.length === 0) {
    errors.push('At least one valid specialty is required.');
  }
  const hourlyRateCents = input.hourlyRateCents ?? null;
  if (
    hourlyRateCents !== null &&
    (!Number.isInteger(hourlyRateCents) || hourlyRateCents < 0)
  ) {
    errors.push('hourlyRateCents must be a non-negative integer.');
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      displayName,
      bio,
      specialties,
      hourlyRateCents,
      availability: {
        acceptingWork: input.acceptingWork ?? true,
        weeklyCapacity: Math.max(0, Math.floor(input.weeklyCapacity ?? 10)),
      },
    },
  };
}
