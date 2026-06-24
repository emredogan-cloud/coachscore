# Phase 6 Execution Report — Additional SKUs (ReplayDoctor · BaseDoctor · WarPlan)

**Status:** ✅ Implemented, local gate green. 🟡 `IMPLEMENTED_BUT_NOT_ACTIVATED` (credential-gated capabilities await service provisioning).
**Branch:** `phase-6-additional-skus`
**Scope:** Three new monetizable SKUs built end-to-end (domain → DB → API → UI), reusing the Phase 2 AI pipeline, Phase 4 payments, and Phase 5 coach-review marketplace.

---

## 1. Systems implemented

### Product framework (`lib/products/`)
| Module | Responsibility |
|---|---|
| `types.ts` | Uniform `ProductReportView` (score + titled sections + recommendations) shared by all three SKUs, so one renderer / one persistence column / one coach-review path serves all. |
| `catalog.ts` | `PRODUCT_CATALOG` — ReplayDoctor $9 (repeatable), BaseDoctor $9, WarPlan $7; all `human_reviewed`. |
| `replay.ts` / `base.ts` / `war.ts` | Deterministic per-SKU analysis engines (no credentials, no network). |
| `validation.ts` | Per-SKU Zod schemas + `parseProductInput` narrowing untrusted input to a typed `ProductInput`. |
| `assemble.ts` | Engine dispatch + assembly into the versioned `ProductReportView`. |
| `pipeline.ts` | `runProductAnalysis` — deterministic engine + **optional** AI enrichment; falls back to the grounded deterministic report when AI is absent or fails. |
| `ai.ts` | `draftProductNotes` — reuses the Phase 2 Anthropic forced-tool pipeline + Zod-validated output + anti-hallucination prompt ("do not invent facts/numbers"); confidence 0.9 success / 0.6 fallback. |
| `render.ts` | HTML-escaped print/web report layout (shared) + mandatory Supercell disclaimer. |
| `service.ts` | `ProductService` — deny-by-default persistence (submission + report), ownership-scoped reads, and coach-review queueing. |

### Database (`lib/db/`)
- New enums: `product_sku`, `product_submission_status`, `product_report_status`.
- New tables: `product_submissions`, `product_reports` (jsonb `analysis` typed as `ProductReportView`).
- Extended for product reuse (nullable + discriminator columns): `orders.product_sku`, `entitlements.product_sku`, `review_assignments.product_report_id` (so the Phase 5 review machine serves product reports unchanged).
- In-memory + Drizzle repositories + interfaces for both new tables.
- **Migrations:** `0006_phase6_products.sql` (tables + `ALTER COLUMN … DROP NOT NULL` + new columns), `0007_phase6_rls.sql` (deny-by-default RLS: owner reads/inserts own submissions, owner/elevated read reports, status writes service-role).

### API (`lib/api/`, `app/api/products/`)
- `handleProductSubmit` — validate → analyze (AI-enriched iff `ANTHROPIC_API_KEY`) → return report **inline** (works with no credentials) → persist **only** when the DB is activated.
- `handleProductReport` — DB-gated retrieval (404 not-found / not-visible).
- `handleProductCheckout` — payments+DB-gated; reuses Phase 4 provider/order machinery via `createProductCheckout` (writes `orders.product_sku`).
- Routes: `POST /api/products/submit`, `GET /api/products/report/[id]`, `POST /api/products/checkout`; server actions in `app/products/actions.ts`.
- New error code `not_found` (404).

### Marketplace + payments reuse
- `MarketplaceService.moderateApprove` / `moderateReject` now advance the linked `product_report` (approved / failed) alongside report reviews — same state machine, no duplication.
- `ProductService.requestCoachReview` enqueues a product report into `review_assignments` via `product_report_id`.

### UI (`app/products/`, `components/products/`)
- `/products` hub + `/products/[sku]` submission flow (SSG-prerendered for all three SKUs).
- `ProductSubmitForm` (client) — per-SKU typed fields → posts → renders the returned report inline.
- `ProductReportViewCard` (presentational, hook-free) — one component for all three SKUs.
- `ProductCards` surfaced on `/products` **and** `/pricing`; home page links to `/products`.

### Auth
- New permissions `product:create`, `product:read:own` (granted to `user`+); mirrored by the product RLS policies.

---

## 2. Credential-gated systems (`IMPLEMENTED_BUT_NOT_ACTIVATED`)

**No new environment variables.** Each existing credential gates exactly one capability; everything else runs without it.

| Capability | Gate (existing var) | Behaviour without the credential |
|---|---|---|
| Inline product report | *(none)* | ✅ Always works — deterministic engine. |
| AI enrichment (summary tone + extra recs) | `ANTHROPIC_API_KEY` | Deterministic report returned; `aiAuthored=false`. |
| Saving + coach review | `DATABASE_URL` | `persistence: { persisted:false, reason:'database_not_configured' }`. |
| Checkout | `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`) | `503 not_activated`. |

Per the execution constraints: **no external calls were fabricated and no fake credentials were used** — credential-gated paths return `not_activated` / `database_not_configured`, never simulated success. Documented in `docs/ENV_SETUP_GUIDE.md` → "Phase 6 — Additional SKUs".

---

## 3. CI / gate evidence (local)

| Gate | Command | Result |
|---|---|---|
| Format | `pnpm format:check` | ✅ pass |
| Lint | `pnpm lint` (eslint) | ✅ pass |
| Typecheck | `pnpm typecheck` (tsc --noEmit) | ✅ pass |
| Tests | `pnpm test` | ✅ **353 passed** / 62 files |
| Coverage | `pnpm test:coverage` | ✅ **95.16% stmts · 89.12% branch · 95.54% funcs** (thresholds 90 / 80) |
| Production build | `pnpm build` | ✅ 9/9 pages; product routes + `/products/[sku]` SSG (×3) |

## 4. Test evidence (40 new tests)

- `tests/products/engines.test.ts` (5), `framework.test.ts` (4), `ai.test.ts` (2), `service.test.ts` (12) — engines, validation/assembly, AI fallback, persistence, ownership, **full coach-review lifecycle** (approve→approved / reject→failed), product checkout.
- `tests/api/products-handler.test.ts` (10) — submit (no-cred / AI / persist seam), checkout (invalid / not-activated / activated), report (503 / 404 / 200).
- `tests/api/phase6-routes.test.ts` (4) — route wiring (inline report, 422, 503 ×2).
- `tests/components/products-ui.test.tsx` (3) — report view (all 3 SKUs) + catalog cards.

---

## 5. Activation steps (when credentials are provisioned)

1. **Database** — set `DATABASE_URL`; run migrations through `0007`. Saving + coach review activate immediately.
2. **AI** — set `ANTHROPIC_API_KEY`. Submissions begin AI-enriched.
3. **Payments** — set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`. `/api/products/checkout` activates.
4. **Auth** — when Supabase Auth replaces the anonymous identity stub (`lib/api/product-wire.ts`), persisted-report ownership + retrieval resolve to the real user.

## 6. Remaining blockers (external, not code)

- **GitHub billing** — required to push the branch, open the PR, and run remote CI / auto-merge. The local gate is green and the branch is ready; pushing is blocked until billing is restored.
- **Service credentials** — Supabase / Anthropic / Stripe keys gate *activation only* (above); no code change required to activate.
- **Webhook product fulfillment** — `orders.product_sku` carries the purchased SKU; granting the product entitlement + marking `product_reports.paid` on `checkout.session.completed` is the one activation-time wiring step that cannot be exercised without a live Stripe key.
