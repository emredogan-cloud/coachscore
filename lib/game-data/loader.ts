/**
 * Accessors + structural validation for the Game-Data Reference Table.
 *
 * `validateReferenceTable` enforces the invariants the scoring engine relies on
 * and tallies verification debt (best-effort values awaiting confirmation). It
 * is run by CI and by the patch watcher; structural errors fail the build,
 * while verification debt is reported, not fatal.
 */

import {
  GAME_DATA_REFERENCE,
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
} from './reference-table';
import { ALL_HERO_IDS } from './types';
import type { GameDataReference, HeroId, TownHallReference } from './types';

export class ReferenceTableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferenceTableError';
  }
}

/** Get the reference row for a Town Hall, or throw if out of coverage. */
export function getTownHallReference(
  townHall: number,
  table: GameDataReference = GAME_DATA_REFERENCE,
): TownHallReference {
  const row = table.townHalls[townHall];
  if (row === undefined) {
    throw new ReferenceTableError(
      `No reference data for Town Hall ${townHall} ` +
        `(covered range: ${MIN_TOWN_HALL}–${MAX_TOWN_HALL}).`,
    );
  }
  return row;
}

export interface ValidationResult {
  readonly ok: boolean;
  /** Hard structural problems — these must fail CI. */
  readonly errors: readonly string[];
  /** Best-effort values awaiting confirmation — reported, not fatal. */
  readonly verificationDebt: readonly string[];
  readonly townHallsCovered: number;
}

/**
 * Validate structural completeness and internal consistency, and collect
 * verification debt. Pure: returns a result rather than throwing, so callers
 * decide how to react.
 */
export function validateReferenceTable(
  table: GameDataReference = GAME_DATA_REFERENCE,
): ValidationResult {
  const errors: string[] = [];
  const verificationDebt: string[] = [];

  if (!table.version) {
    errors.push('Table is missing a version.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(table.effectiveFrom)) {
    errors.push(
      `effectiveFrom must be an ISO date; got "${table.effectiveFrom}".`,
    );
  }

  for (let th = MIN_TOWN_HALL; th <= MAX_TOWN_HALL; th++) {
    const row = table.townHalls[th];
    if (row === undefined) {
      errors.push(`Missing reference row for Town Hall ${th}.`);
      continue;
    }
    if (row.townHall !== th) {
      errors.push(`Row keyed ${th} reports townHall ${row.townHall}.`);
    }
    if (row.previousTownHall !== th - 1) {
      errors.push(
        `TH${th} previousTownHall must be ${th - 1}; got ${row.previousTownHall}.`,
      );
    }

    // Every hero id must be present (locked or unlocked).
    for (const heroId of ALL_HERO_IDS) {
      const hero = row.heroes[heroId];
      if (hero === undefined) {
        errors.push(`TH${th} is missing hero "${heroId}".`);
        continue;
      }
      if (hero.unlocked && hero.maxLevel <= 0) {
        errors.push(
          `TH${th} ${heroId} is unlocked but has maxLevel ${hero.maxLevel}.`,
        );
      }
      if (!hero.unlocked && hero.maxLevel !== 0) {
        errors.push(
          `TH${th} ${heroId} is locked but has maxLevel ${hero.maxLevel}.`,
        );
      }
      if (hero.unlocked && hero.deCostWeight <= 0) {
        errors.push(
          `TH${th} ${heroId} is unlocked but has deCostWeight ${hero.deCostWeight}.`,
        );
      }
      if (hero.needsVerification) {
        verificationDebt.push(`TH${th} hero "${heroId}"`);
      }
    }

    // Equipment must be N/A below 16 and present at/above 16.
    if (th < 16 && row.equipment.available) {
      errors.push(`TH${th} must have equipment N/A (available only at TH16+).`);
    }
    if (th >= 16 && !row.equipment.available) {
      errors.push(`TH${th} must have equipment available (TH16+).`);
    }
    if (row.equipment.available && row.equipment.needsVerification) {
      verificationDebt.push(`TH${th} equipment`);
    }

    // Categories present + debt tally.
    for (const [catId, cat] of Object.entries(row.categories)) {
      if (cat.representativeMaxLevel <= 0) {
        errors.push(`TH${th} category "${catId}" has non-positive max level.`);
      }
      if (cat.needsVerification) {
        verificationDebt.push(`TH${th} category "${catId}"`);
      }
    }
  }

  const townHallsCovered = Object.keys(table.townHalls).length;

  return {
    ok: errors.length === 0,
    errors,
    verificationDebt,
    townHallsCovered,
  };
}

export function heroIdsUnlockedAt(townHall: number): HeroId[] {
  const row = getTownHallReference(townHall);
  return ALL_HERO_IDS.filter((id) => row.heroes[id].unlocked);
}
