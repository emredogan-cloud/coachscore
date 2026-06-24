/**
 * Coach specialties (Phase 5). A fixed catalog mapped to the product's goals +
 * Town-Hall bands, with parsing/validation that drops unknowns and de-dupes.
 */

export const SPECIALTIES = [
  'war',
  'trophy',
  'derush',
  'progression',
  'equipment',
  'clan',
  'th_low',
  'th_high',
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

const SET: ReadonlySet<string> = new Set(SPECIALTIES);

export function isSpecialty(value: string): value is Specialty {
  return SET.has(value);
}

/** Keep only known specialties, de-duplicated, in catalog order. */
export function parseSpecialties(values: readonly string[]): Specialty[] {
  const present = new Set(values.filter(isSpecialty));
  return SPECIALTIES.filter((s) => present.has(s));
}
