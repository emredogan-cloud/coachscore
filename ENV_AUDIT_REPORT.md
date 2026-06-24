# ENV AUDIT REPORT — CoachScore

**Date:** 2026-06-24 · **Sprint:** Final Production Hardening (Phase A)
**Sources audited:** `.env.local`, `.env.example`, `lib/env.ts`, `lib/activation.ts`, and a full repo scan of `process.env` / `requireEnv` / `optionalEnv` / `present` references in `lib/**` + `app/**` + `scripts/**`.

> **Method:** Variable **names** and **set/empty** state were read from `.env.local`; **no secret values are reproduced here.** "Used in" comes from a code reference scan. "Reachable" comes from live network probes run this session (HTTP status / DNS), not assumptions.

---

## 0. Two correctness bugs found (fix before launch)

1. **Trailing space in two variable names.** In `.env.local` the keys are literally `OPEN_AI_API_KEY␠` and `NEXT_PUBLIC_SUPABASE_ANON_KEY␠` (trailing space). Depending on the env loader, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` can resolve to **`undefined`**. Remove the trailing space.
2. **OpenAI key name mismatch.** The key is `OPEN_AI_API_KEY`; the standard name every OpenAI SDK/tool expects is `OPENAI_API_KEY`. The prompt also refers to it as `OPENAI_API_KEY`. The app does **not** read it at runtime (0 references — see below), so this only matters for the Phase-E asset tooling, which reads the actual name explicitly. Recommend standardizing to `OPENAI_API_KEY`.

---

## 1. Live reachability (this sandbox, this session)

| Service | Probe result | Consequence |
|---|---|---|
| **OpenAI** (`api.openai.com`) | `GET /v1/models` → **200**, `gpt-image-1` present | Asset generation (Phase E) **works** |
| **Supabase Auth/REST** (`<ref>.supabase.co`) | `/auth/v1/health`, `/rest/v1/` → **401** (reachable; needs apikey) | supabase-js paths *would* work over HTTPS |
| **Supabase direct Postgres** (`db.<ref>.supabase.co:6543`) | **no A/no AAAA record, TCP closed** | `DATABASE_URL` / Drizzle **cannot connect from here** |
| **Cloudflare R2** (`<acct>.r2.cloudflarestorage.com`) | **400** (reachable; needs S3 auth) | R2 storage **works** with credentials |
| **Stripe / Resend / PostHog** | not probed (keys empty or out of scope) | — |

**Key nuance:** the Supabase **HTTPS API** is reachable but the **direct Postgres** endpoint is not (it doesn't even resolve here). Since the app persists via `DATABASE_URL` (Drizzle/postgres-js), **database-backed features still cannot be exercised from this environment** — unchanged from prior sessions. In real production (proper IPv4/IPv6 networking, or the Supabase **pooler** host), it connects normally.

---

## 2. Full variable inventory

Legend — **State:** `VALIDATED` (set + used + reachable), `SET-UNUSED` (set but no code reads it), `MISSING` (used by code, not set), `OPTIONAL` (graceful default), `DEAD` (no code, no dep).

| Variable | Purpose | Used in | Prod-required? | State | Action |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical/OG/sitemap origin | `lib/seo/metadata.ts`, `lib/env.ts` | **Yes** | SET (=localhost in `.env.local`) | Set to `https://coachscore.app` in prod |
| `NEXT_PUBLIC_APP_ENV` | Runtime env label | `lib/env.ts` | No | SET | Set `production` in prod |
| `ANTHROPIC_API_KEY` | AI OCR + roadmap drafting (core product) | `lib/ai/provider.ts` | **Yes** | VALIDATED | Keep |
| `ANTHROPIC_MODEL_REASONING` | Opus model id | `lib/ai/provider.ts` | No | SET (OPTIONAL) | Keep |
| `ANTHROPIC_MODEL_EXTRACTION` | Haiku model id | `lib/ai/provider.ts` | No | SET (OPTIONAL) | Keep |
| `OPEN_AI_API_KEY␠` | Phase-E asset generation **tooling only** | none (0 refs) | No | SET-UNUSED + name bug | Rename → `OPENAI_API_KEY` (no trailing space); not needed by app runtime |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Auth/REST base | **none (0 refs)** | No (today) | SET-UNUSED | Needed only when Supabase Auth is wired (still anon stub) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY␠` | Supabase client anon key | **none (0 refs)** | No (today) | SET-UNUSED + name bug | Fix trailing space; wire Auth or defer |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin (bypasses RLS) | **none (0 refs)** | No (today) | SET-UNUSED | **Security:** a highly-privileged key that nothing uses — remove until needed, or wire it |
| `DATABASE_URL` | Postgres (Drizzle) — all persistence | `lib/db/client.ts` | **Yes** | SET but **unreachable here** | In prod use the Supabase **pooler** host; direct `db.<ref>` host doesn't resolve from this env |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Object storage (screenshots/PDF/share cards) | `lib/storage/r2.ts`, `lib/activation.ts` | **Yes** | VALIDATED (endpoint reachable) | Keep; run a storage smoke test on deploy |
| `STRIPE_SECRET_KEY` | Stripe checkout | `lib/payments/stripe-adapter.ts` | Conditional | **MISSING** (empty) | **See Phase B — recommend LemonSqueezy instead** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verify | `lib/payments/stripe-adapter.ts` | Conditional | MISSING | Replace with LemonSqueezy (Phase B) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js publishable | `lib/payments/stripe-adapter.ts` | Conditional | MISSING | Not needed with hosted checkout; replace (Phase B) |
| `STRIPE_CONNECT_CLIENT_ID` | Coach **payouts** (marketplace) | `lib/payouts/connect-adapter.ts` | No (marketplace not live) | OPTIONAL (unset) | Keep for payout rail decision (see Phase B note) |
| `INNGEST_EVENT_KEY` | (intended job queue) | **none (0 refs, no dep)** | No | **DEAD** | **Remove** from `.env.example`/`.env.local` |
| `INNGEST_SIGNING_KEY` | (intended job queue) | **none (0 refs, no dep)** | No | **DEAD** | **Remove** |
| `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics + experiments | `lib/analytics/posthog-adapter.ts` | No | MISSING (empty) → OPTIONAL | Set to enable analytics; degrades to no-op otherwise |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingest host | `lib/analytics/posthog-adapter.ts` | No | SET (OPTIONAL) | Keep |
| `RESEND_API_KEY` | Transactional email (receipts/delivery) | `lib/email/resend-adapter.ts` | **Yes** (for paid flow) | SET | Keep; verify domain |
| `RESEND_FROM_EMAIL` | Verified sender address | `lib/email/resend-adapter.ts` | **Yes** (for email) | **MISSING** (not in `.env.local`) | Set a verified from-address |
| `COC_API_TOKEN` / `COC_API_PROXY_URL` | CoC tag-intake (fixed-IP proxy) | `lib/api/*` intake | No | MISSING → OPTIONAL | Manual/screenshot intake works without; set to enable tag intake |
| `SENTRY_DSN` | Error reporting | `lib/observability/wire.ts` | No | OPTIONAL (unset) | Set in prod (recommended) |
| `BETTERSTACK_HEARTBEAT_URL` | Uptime heartbeat | `lib/observability/wire.ts` | No | OPTIONAL (unset) | Optional |
| `LOG_LEVEL` | Log verbosity | `lib/observability/wire.ts` | No | OPTIONAL (unset) | Optional |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Privacy-friendly traffic analytics | `lib/activation.ts` | No | OPTIONAL (unset) | Optional |
| `NEXT_PUBLIC_SOCIAL_PROFILES` | Org `sameAs` (SEO) | `lib/seo/metadata.ts` | No | OPTIONAL (unset) | Set real profile URLs once they exist |

---

## 3. Summary counts

- **VALIDATED (set + used + reachable):** `ANTHROPIC_API_KEY`, `R2_*` (4), `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_HOST`, `RESEND_API_KEY` → **8**.
- **SET BUT UNUSED:** `OPEN_AI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → **4** (the three Supabase vars are needed only when Auth is wired; the OpenAI key is tooling-only).
- **REQUIRED BUT MISSING (for the paid/email flow):** `RESEND_FROM_EMAIL`, plus the billing keys — **but billing is being re-decided (Phase B → LemonSqueezy)**, so the three `STRIPE_*` customer-billing keys are *superseded* rather than simply "missing."
- **OPTIONAL:** `NEXT_PUBLIC_APP_ENV`, `ANTHROPIC_MODEL_*`, `STRIPE_CONNECT_CLIENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `COC_API_*`, `SENTRY_DSN`, `BETTERSTACK_HEARTBEAT_URL`, `LOG_LEVEL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_SOCIAL_PROFILES`.
- **DEAD/LEGACY:** `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` → **2** (no code, no dependency).

---

## 4. Actions taken in this sprint

- `.env.example` updated: **removed** the two dead `INNGEST_*` keys; **added** `OPENAI_API_KEY` (tooling, documented as not-runtime); **added** the LemonSqueezy block (Phase B); annotated `SUPABASE_*` as "used only when Auth is wired"; annotated `DATABASE_URL` with the pooler-host recommendation.
- `.env.local` is **not** committed and is **not** modified by this sprint (it holds live secrets). The trailing-space and `OPEN_AI_API_KEY`→`OPENAI_API_KEY` fixes are **manual actions for the operator** (documented here and in `.env.example`).

## 5. Pre-launch checklist (operator)

1. Fix `.env.local` key names: `OPEN_AI_API_KEY␠`→`OPENAI_API_KEY`, remove trailing space on `NEXT_PUBLIC_SUPABASE_ANON_KEY␠`.
2. Set `NEXT_PUBLIC_APP_URL=https://coachscore.app`, `NEXT_PUBLIC_APP_ENV=production`.
3. Set `RESEND_FROM_EMAIL` to a verified sender.
4. Use the Supabase **pooler** `DATABASE_URL` for serverless deploys.
5. Decide billing per **Phase B** (LemonSqueezy recommended) and set its keys.
6. Either wire Supabase Auth (consume `SUPABASE_*`) or remove those keys (esp. the service-role key) until needed.
7. Optional but recommended for launch: `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN`.
