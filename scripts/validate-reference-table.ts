/**
 * Patch-watcher entrypoint: validate the Game-Data Reference Table.
 *
 * Run via `pnpm validate:reference`. Exits non-zero on STRUCTURAL errors (these
 * gate CI). Verification debt (best-effort values awaiting confirmation) is
 * printed as a report but does not fail — that debt is burned down by the
 * data-entry task, not by blocking the build.
 */

/* eslint-disable no-console -- this is a CLI script; console output is the UI */

import {
  GAME_DATA_REFERENCE,
  validateReferenceTable,
} from '../lib/game-data/index';

function main(): void {
  const result = validateReferenceTable(GAME_DATA_REFERENCE);

  console.log(
    `Reference table v${GAME_DATA_REFERENCE.version} ` +
      `(effective ${GAME_DATA_REFERENCE.effectiveFrom}) — ` +
      `${result.townHallsCovered} Town Halls covered.`,
  );

  if (result.verificationDebt.length > 0) {
    console.warn(
      `\n⚠ ${result.verificationDebt.length} fields need verification ` +
        `against the live game before backing a paid report:`,
    );
    for (const item of result.verificationDebt) {
      console.warn(`  - ${item}`);
    }
  }

  if (!result.ok) {
    console.error(`\n✖ ${result.errors.length} STRUCTURAL error(s):`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('\n✔ Reference table is structurally valid.');
}

main();
