# Phase 7 Execution Report — Growth Infrastructure

**Status:** ✅ Implemented, local gate green. 🟡 `IMPLEMENTED_BUT_NOT_ACTIVATED` (analytics forwarding, persistence, email delivery, and admin/referral auth are credential-gated).
**Branch:** `phase-7-growth`
**Scope:** Analytics, experimentation, referrals, viral sharing, SEO, lifecycle messaging, and a growth dashboard — built end-to-end (domain → DB → API → UI), reusing the Phase 2–6 rails. **No new required credentials.**

---

## 1. Systems implemented

### Analytics (`lib/analytics/`)
- Provider-agnostic `AnalyticsService` behind an `AnalyticsProvider` interface; **closed event taxonomy** matching the roadmap funnel instrumentation (`teaser_started`, `teaser_completed`, `checkout_started`, `report_delivered`, `report_rated`, `reanalysis_started`, `share_card_generated`, + product/referral/experiment events).
- **PII scrubbing** (`stripPii`, GDPR/KVKK denylist) before any sink.
- Sinks: `PostHogProvider` (HTTP `/capture/`, EU default, I/O boundary), `Noop`/`Memory`/`Composite` providers; optional **local persistence** to `analytics_events` so the dashboard works without PostHog.
- Pure **funnel** model (`computeFunnel` + acquisition/product/viral funnels).

### Experimentation (`lib/experiments/`)
- **Deterministic, sticky** assignment via a stable FNV-1a hash (no randomness/clock) → variant by weight; percentage-rollout **feature flags**.
- The roadmap's pre-registered experiments (teaser depth, paywall placement, pricing anchor, referral incentive, default tier, SEO CTA) + growth flags.
- `ExperimentService`: sticky assign, persist on first exposure, **single exposure event**, flag evaluation.

### Referrals (`lib/referrals/`)
- Creator-code style codes (stable per user, unambiguous alphabet); reward policy (capped referrer credit + flat referee discount — the A/B variable); attribution (`parseReferralParam`, K-factor stats).
- `ReferralService`: get-or-create code, claim (guards self-claim/double-claim/bad code), **qualify on purchase**, list-mine.

### Viral sharing (`lib/share/` ext)
- Social share-intent URLs (X/WhatsApp/Reddit/Telegram/Facebook/copy), **UTM + ref attribution** tagging + parsing, and referral **flex cards** with status-flex vs. help-seeking copy.

### SEO (`lib/seo/`, `app/`)
- Metadata framework (canonical + OG + Twitter), JSON-LD builders (Organization/WebSite/FAQ/Breadcrumb/Article), `sitemap.xml` + `robots.txt` route handlers.
- **Programmatic per-Town-Hall guides** generated from the real reference-table range (TH11–18) — upgrade-order, rush-checker, and equipment-priority (TH16+ only). Methodology content, **no fabricated game caps** (ADR-0004); each ends in the free-checker CTA. `/guides` + `/guides/[slug]` (SSG).

### Lifecycle messaging (`lib/lifecycle/`)
- Deterministic rules engine: D1 onboarding, abandoned checkout, D7 retention, D30 winback. `LifecycleService` schedules (deduped) + dispatches through a **feature-gated** delivery boundary — un-deliverable messages stay `scheduled`, never faked.

### Growth dashboard (`lib/growth/`, `app/admin/growth`)
- Pure aggregation: funnel metrics, KPI summary (teaser→paid, visit→teaser), experiment splits, referral/K-factor. `GrowthService` reads the persisted tables; admin page renders it or a not-activated panel.

### Database
- 5 tables (`analytics_events`, `experiment_assignments`, `referral_codes`, `referrals`, `lifecycle_messages`) + enums; in-memory + Drizzle repos; migrations **0008** (tables) / **0009** (deny-by-default RLS). New permissions `referral:create` / `referral:read:own`. Activation predicates `isAnalyticsConfigured` / `isPlausibleConfigured`.

### API + UI
- Routes: `/api/analytics/track`, `/api/experiments/{assign,flags}`, `/api/referrals`, `/api/referrals/claim`, `/api/growth/dashboard` + server actions.
- UI: `/guides`, `/guides/[slug]`, `/referrals`, `/admin/growth`, a GDPR/KVKK **consent banner** (root layout), share buttons, and the referral panel.

---

## 2. Credential gating (`IMPLEMENTED_BUT_NOT_ACTIVATED`)

**No new required env vars.** Each gate lights one capability; everything else runs without it — no external call is ever faked.

| Capability | Gate | Behaviour without it |
|---|---|---|
| Event capture (taxonomy + funnel) | *(none)* | ✅ Works — forwards to a no-op sink. |
| PostHog forwarding | `NEXT_PUBLIC_POSTHOG_KEY` | No-op forward; events still persist locally if DB is on. |
| Plausible traffic analytics | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Script tag omitted. |
| Experiment assignment + flags | *(none)* | ✅ Works — deterministic. |
| Analytics/assignment/referral persistence + dashboard | `DATABASE_URL` | `persisted:false`; referrals/dashboard `503 not_activated`. |
| Lifecycle / winback delivery | `RESEND_API_KEY` | Messages stay `scheduled`. |
| Referral writes + growth dashboard auth | Supabase **Auth** (stub) | `503 not_activated` (anonymous identity stub). |

---

## 3. Local gate evidence

| Gate | Command | Result |
|---|---|---|
| Format | `pnpm format:check` | ✅ pass |
| Lint (`--max-warnings=0`) | `pnpm lint` | ✅ pass |
| Typecheck | `pnpm typecheck` | ✅ pass |
| Tests | `pnpm test` | ✅ **418 passed** / 72 files (+65 Phase 7) |
| Coverage | `pnpm test:coverage` | ✅ **95.67% stmts · 88.36% branch** (thresholds 90 / 80) |
| Reference table | `pnpm validate:reference` | ✅ structurally valid |
| Production build | `pnpm build` | ✅ 24 static pages; SEO guides SSG; all growth routes |

## 4. Test evidence (65 new tests)
`tests/analytics` (9), `tests/experiments` (7), `tests/referrals` (8), `tests/share/viral` (4), `tests/seo` (8), `tests/lifecycle` (7), `tests/growth/metrics` (3), `tests/api/growth-handler` (11), `tests/components/growth-ui` (2), `tests/api/phase7-routes` (6).

## 5. Activation steps
1. **Database** (`DATABASE_URL`) + migrations through `0009` → analytics/assignment/referral persistence + the growth dashboard.
2. **PostHog** (`NEXT_PUBLIC_POSTHOG_KEY`, EU host) → event forwarding + native experiments reconcile with the in-code ones.
3. **Plausible** (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) → traffic analytics.
4. **Resend** (`RESEND_API_KEY`) + a `LifecycleDeliverer` wired in `dispatchDue` → lifecycle/winback sends.
5. **Supabase Auth** (replace the `resolveGrowthIdentity` stub) → referral writes + admin dashboard resolve to the real user.

## 6. Remaining blockers (external, not code)
- **Service credentials** gate activation only (above) — no code change required.
- **Supabase Auth** is the one shared soft-blocker: referral writes + the admin dashboard return `not_activated` until the anonymous-identity stub is replaced (same stub as Phases 3–6).
- **Lifecycle delivery wiring**: the email-backed `LifecycleDeliverer` is the one activation-time adapter to add (the service + rules are built + tested behind the interface).
