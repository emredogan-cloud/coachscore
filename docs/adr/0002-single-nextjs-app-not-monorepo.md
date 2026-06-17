# 2. Single Next.js app, not a monorepo

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

The master execution prompt allows a monorepo "if justified." `TECH_DECISIONS.md`
is explicit: the guiding principle is "one codebase, one deploy, minimal ops
surface for a solo founder." CoachScore is a web-first PWA where the frontend,
API, scoring engine, and AI orchestration all share types and deploy together.

## Decision

Use a **single Next.js application** with clear internal module boundaries under
`lib/` (e.g. `lib/core` for the scoring engine, `lib/game-data` for the reference
table, `lib/ai`, `lib/intake`) rather than a multi-package monorepo (pnpm
workspaces / Turborepo).

Module boundaries are enforced by directory convention + the `@/*` path alias,
and the scoring engine is kept dependency-free and framework-agnostic so it
*could* be extracted into its own package later without a rewrite.

## Consequences

- Minimal tooling: one `package.json`, one build, one deploy target (Vercel).
- Shared TypeScript types across UI, API, and engine with zero packaging.
- If a future phase needs independent deploy/versioning (e.g. a standalone
  scoring service), the dependency-free engine extracts cleanly.
- Risk: weaker enforced boundaries than separate packages — mitigated by keeping
  `lib/core` pure (no React/Next imports), checked by review and lint scope.

## Alternatives considered

- **pnpm workspace monorepo / Turborepo:** more ceremony, more ops, premature for
  a solo founder; contradicts the source's stated principle.
- **Separate backend service from day one:** extra deploy + infra surface with no
  Phase-0 benefit; the queue (Inngest) already isolates heavy async work.
