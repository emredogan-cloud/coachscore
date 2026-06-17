# Pull Request

## Phase / Scope

<!-- Which execution phase does this PR belong to? e.g. phase-1-core-engine -->

## What changed

<!-- A concise description of the change and why. -->

## How it was verified

- [ ] `pnpm validate` passes locally (format, lint, typecheck, test)
- [ ] `pnpm test:coverage` meets thresholds
- [ ] `pnpm build` succeeds
- [ ] `pnpm validate:reference` passes (if reference table touched)

## Checklist

- [ ] No secrets committed (values live in env vars; see `.env.example`)
- [ ] No `TODO`, placeholder, or mock implementations left behind
- [ ] Tests added/updated for new behavior (unit / golden / property)
- [ ] An ADR was added or updated if this changes architecture
- [ ] Docs (`README`, `docs/`) match the implementation
- [ ] The Supercell disclaimer is intact on any new user-facing surface

## Risk / rollback

<!-- Anything reviewers should watch; how to revert if needed. -->
