# 4. Versioned Game-Data Reference Table (data, not code)

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

Scores are computed against **TH-relative maxima** (deep-dive §7.1): "how
developed are you *for your Town Hall*." Supercell ships balance changes, raises
caps, and adds Town Halls regularly. If caps were hardcoded across the codebase,
every patch would mean code changes and regressions. The reference table is also
identified as a defensible ops asset and a moat input.

## Decision

Model all TH-relative maxima as a **versioned data structure**
(`lib/game-data`), not as constants scattered in logic:

- Every value carries a `needsVerification` flag. Only values confirmed by an
  authoritative source (the deep-dive worked examples, the live game) are marked
  verified; uncertain values are flagged, **never fabricated** (see ADR 0005).
- The table has a `version` + `effectiveFrom`, bumped on every patch.
- A validator (`validateReferenceTable`) enforces structural invariants the
  engine relies on (every hero present, equipment N/A below TH16, previous-TH
  link correct) and reports verification debt.
- A **patch-watcher** script (`pnpm validate:reference`) runs in CI and is the
  ritual for keeping the table current after each Supercell release.

## Consequences

- A new Town Hall or balance change = one data update + a version bump + a
  validator run. No formula changes (patch-robustness).
- Verification debt is explicit and tracked, not hidden behind false precision.
- Full per-element building/troop/spell/trap tables are a dedicated data-entry
  task; until populated they are structurally present and flagged.

## Alternatives considered

- **Hardcoded caps in the engine:** brittle, patch-fragile, untestable as data.
- **Fetch caps from the CoC API at runtime:** the API is non-commercial/gray and
  doesn't cleanly expose all caps; would couple scoring to a fragile dependency.
