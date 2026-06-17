import { describe, expect, it } from 'vitest';
import { GAME_DATA_REFERENCE, validateReferenceTable } from '@/lib/game-data';
import type { GameDataReference } from '@/lib/game-data';

/** Deep-writable mirror of the (deeply readonly) reference type, for fixtures. */
type DeepMutable<T> = { -readonly [K in keyof T]: DeepMutable<T[K]> };

function clone(): DeepMutable<GameDataReference> {
  return structuredClone(GAME_DATA_REFERENCE) as DeepMutable<GameDataReference>;
}

function validate(t: DeepMutable<GameDataReference>) {
  return validateReferenceTable(t as unknown as GameDataReference);
}

/** Return a TH row, asserting presence so tests fail loudly on bad setup. */
function thRow(t: DeepMutable<GameDataReference>, th: number) {
  const row = t.townHalls[th];
  if (!row) {
    throw new Error(`test setup error: TH${th} missing from clone`);
  }
  return row;
}

function errorsOf(t: DeepMutable<GameDataReference>): string[] {
  return [...validate(t).errors];
}

describe('validateReferenceTable — accepts the real table', () => {
  it('reports ok with zero errors', () => {
    const result = validateReferenceTable();
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe('validateReferenceTable — catches structural problems', () => {
  it('flags a missing version', () => {
    const t = clone();
    t.version = '';
    expect(errorsOf(t).some((e) => e.includes('version'))).toBe(true);
  });

  it('flags a non-ISO effectiveFrom', () => {
    const t = clone();
    t.effectiveFrom = 'yesterday';
    expect(errorsOf(t).some((e) => e.includes('effectiveFrom'))).toBe(true);
  });

  it('flags a missing Town Hall row', () => {
    const t = clone();
    delete t.townHalls[13];
    const result = validate(t);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('Town Hall 13'))).toBe(true);
  });

  it('flags a townHall key/value mismatch', () => {
    const t = clone();
    thRow(t, 13).townHall = 99;
    expect(errorsOf(t).some((e) => e.includes('reports townHall 99'))).toBe(
      true,
    );
  });

  it('flags an incorrect previousTownHall', () => {
    const t = clone();
    thRow(t, 14).previousTownHall = 99;
    expect(errorsOf(t).some((e) => e.includes('previousTownHall'))).toBe(true);
  });

  it('flags an unlocked hero with non-positive maxLevel', () => {
    const t = clone();
    thRow(t, 13).heroes.barbarianKing.maxLevel = 0;
    expect(
      errorsOf(t).some((e) => e.includes('unlocked but has maxLevel')),
    ).toBe(true);
  });

  it('flags a locked hero carrying a non-zero maxLevel', () => {
    const t = clone();
    thRow(t, 11).heroes.royalChampion.maxLevel = 5; // RC is locked at TH11
    expect(errorsOf(t).some((e) => e.includes('locked but has maxLevel'))).toBe(
      true,
    );
  });

  it('flags an unlocked hero with zero cost weight', () => {
    const t = clone();
    thRow(t, 13).heroes.archerQueen.deCostWeight = 0;
    expect(errorsOf(t).some((e) => e.includes('deCostWeight'))).toBe(true);
  });

  it('flags equipment present below TH16', () => {
    const t = clone();
    thRow(t, 13).equipment = {
      available: true,
      keyEpicsTotal: 1,
      maxLevel: 1,
      needsVerification: true,
    };
    expect(errorsOf(t).some((e) => e.includes('equipment N/A'))).toBe(true);
  });

  it('flags equipment missing at TH16+', () => {
    const t = clone();
    thRow(t, 16).equipment = { available: false };
    expect(errorsOf(t).some((e) => e.includes('equipment available'))).toBe(
      true,
    );
  });

  it('flags a non-positive category max level', () => {
    const t = clone();
    thRow(t, 13).categories.walls.representativeMaxLevel = 0;
    expect(errorsOf(t).some((e) => e.includes('non-positive max level'))).toBe(
      true,
    );
  });
});
