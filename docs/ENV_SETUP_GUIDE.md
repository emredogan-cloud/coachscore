# CoachScore — Environment Variable Setup Guide

> A founder-grade manual to obtain and configure **every** credential CoachScore
> needs, Phase 0 → Phase 9. Built by auditing `.env.example`, the source code,
> CI/CD workflows, the roadmap, the ADRs, and the strategy reports. Each variable
> cites its source. Variables planned for later phases but not yet wired into
> code are labeled **`PLANNED_NOT_IMPLEMENTED`**.
>
> *Unofficial; not endorsed by Supercell. Not legal advice. Provider dashboards
> change — if an exact click path differs, use the provider's search for the
> named destination.*

## Legend

- **`IMPLEMENTED`** — read by code today (citation points at the source file/line).
- **`DECLARED`** — present in `coachscore/.env.example` for a future phase; not yet read by code.
- **`PLANNED_NOT_IMPLEMENTED`** — referenced only in roadmap/architecture/reports; not in `.env.example` or code yet.
- **`SUPERSEDED`** — declared earlier but replaced by another mechanism.

## Audit sources

| Source | Used for |
|--------|----------|
| `coachscore/.env.example` | canonical declared variable list |
| `lib/env.ts`, `lib/ai/provider.ts` | variables actually read by code |
| `.github/workflows/*.yml` | variables referenced in CI |
| `COACHSCORE_ROADMAP.md` §3 / §8 | planned stack + cost grounding |
| `reports/TECH_DECISIONS.md` | provider choices + tradeoffs |
| `docs/adr/0005`, `0006` | AI/compliance credential posture |

---

# Quick Start (minimum to continue from the current state)

The repo is at **Phase 4 complete (implemented; activation pending credentials)**.
Phases 0–2 run end-to-end with exactly **one real credential** (`ANTHROPIC_API_KEY`).
Phases 3–4 are **IMPLEMENTED_BUT_NOT_ACTIVATED** — fully built behind interfaces;
they light up when their credentials (Supabase, R2, Stripe, Resend) are provided.

| Variable | Why | Status |
|----------|-----|--------|
| `ANTHROPIC_API_KEY` | the AI pipeline (Phase 2) — already provided in `.env` | ✅ set |
| `ANTHROPIC_MODEL_REASONING` | Opus model id (has a default) | optional |
| `ANTHROPIC_MODEL_EXTRACTION` | Haiku model id (has a default) | optional |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_ENV` | app config (have defaults) | optional |

**To unblock the next phase (Phase 3 — Data Intake/Persistence), obtain:**

1. **Supabase** → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
2. **Cloudflare R2** → `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`

Put them in `coachscore/.env.local` (git-ignored). That is the entire Phase 3
prerequisite.

```bash
cd coachscore
cp .env.example .env.local   # then fill in the values below
pnpm dev                     # http://localhost:3000
```

---

# Variable Inventory (grouped by provider)

Provider-level **Dashboard Navigation**, **Step-by-Step Creation**, and
**Pricing Tier** are shared by that provider's sibling variables and written once
per provider; each variable still lists its own Purpose, Required?, Example,
Verification, Common Mistakes, and Security Notes.

---

## Provider: App / Next.js (no external account)

**Pricing Tier:** Free (built-in).
**Dashboard Navigation:** none — set directly in `.env.local` / Vercel project env.

### `NEXT_PUBLIC_APP_URL`
- **Phase Introduced:** Phase 0 — Foundation
- **Status:** `IMPLEMENTED` — `lib/env.ts:31` (`optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')`); declared `.env.example:10`
- **Required?** Optional (defaults to `http://localhost:3000`); **Recommended** in preview/production
- **Purpose:** Canonical base URL for absolute links, share-card/OG image URLs, and email links.
- **Provider:** App config
- **Example Value:** `https://coachscore.app`
- **Verification:** `curl -s localhost:3000/api/health` returns `{"status":"ok",...}`; in the browser, generated links use this origin.
- **Common Mistakes:** Trailing slash; using `http` in production; forgetting to set it per-environment in Vercel (preview vs production differ).
- **Security Notes:** Public (`NEXT_PUBLIC_` is shipped to the browser). Safe in Vercel + GitHub. Never put secrets behind a `NEXT_PUBLIC_` name.

### `NEXT_PUBLIC_APP_ENV`
- **Phase Introduced:** Phase 0
- **Status:** `IMPLEMENTED` — `lib/env.ts:32`; also set in CI at `.github/workflows/production-build.yml:37`; declared `.env.example:11`
- **Required?** Optional (defaults to `development`); **Recommended** to set explicitly per environment
- **Purpose:** Environment discriminator (`development` | `preview` | `production`) surfaced by `/api/health` and used to gate environment-specific behavior.
- **Provider:** App config
- **Example Value:** `production`
- **Verification:** `/api/health` JSON `env` field reflects the value.
- **Common Mistakes:** Free-text typos (e.g. `prod` vs `production`); leaving it `development` in a production deploy.
- **Security Notes:** Public, non-sensitive. Safe everywhere.

---

## Provider: Anthropic (Claude API)

**Pricing Tier:** **Paid, usage-based** (per input/output token; no ongoing free tier beyond any initial signup credits). Per the cost model (`COACHSCORE_ROADMAP.md` §8) a report draft costs ~**$0.30–$0.48** blended (Opus reasoning + Haiku extraction), trending lower with prompt caching.
**Dashboard Navigation:** `console.anthropic.com` → **Settings** → **API Keys** → **Create Key**. Billing: **Settings → Billing → add payment method / credits**.
**Step-by-Step Creation:**
1. Go to `https://console.anthropic.com` and sign up / log in.
2. **Settings → Billing** → add a payment method (the API requires billing/credits; the messages API used by `lib/ai/provider.ts` will 400/402 without it).
3. **Settings → API Keys → Create Key**, name it `coachscore-server`, copy the `sk-ant-…` value once (it is shown only once).
4. Paste into `.env.local` as `ANTHROPIC_API_KEY`.
5. (Optional) Set the two model-id variables to pin exact model versions.

### `ANTHROPIC_API_KEY`
- **Phase Introduced:** Phase 2 — AI Pipeline
- **Status:** `IMPLEMENTED` — `lib/ai/provider.ts:18` (`requireEnv('ANTHROPIC_API_KEY')`); declared `.env.example:15`; mandated by ADR 0005
- **Required?** **Required** for Phase 2+ (the draft/OCR pipeline). The app still *builds* without it (client is lazy) — it fails only when AI is invoked.
- **Purpose:** Authenticates server-side calls to Claude for report drafting (Opus) and screenshot extraction (Haiku).
- **Provider:** Anthropic
- **Example Value:** `sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Verification:**
  - CLI: `curl -s https://api.anthropic.com/v1/models -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01"` returns a model list (200).
  - Application: `pnpm test:integration` (loads `.env`) runs the live draft test green.
- **Common Mistakes:** Using a key from a project with no billing/credits (→ 402/400); committing the key (use `.env.local`/`.env`, both git-ignored); adding it to a **public** repo's Actions secrets (avoid — see Security).
- **Security Notes:** **Server-only secret.** Store in `.env.local` locally and in **Vercel → Project → Settings → Environment Variables** (Production/Preview) as a *non-public* var. **Do NOT add to a public GitHub repo's Actions secrets** (the live test self-skips in CI by design — `tests/integration/ai.live.test.ts`). Rotate via the Anthropic console if exposed.

### `ANTHROPIC_MODEL_REASONING`
- **Phase Introduced:** Phase 2
- **Status:** `IMPLEMENTED` — `lib/ai/provider.ts:25` (`optionalEnv('ANTHROPIC_MODEL_REASONING', 'claude-opus-4-8')`); declared `.env.example:16`
- **Required?** Optional (has a default). **Recommended** to pin for reproducibility.
- **Purpose:** Model id for the high-quality diagnosis/roadmap reasoning step.
- **Provider:** Anthropic
- **Example Value:** `claude-opus-4-8`
- **Verification:** The live integration test returns `usage.outputTokens > 0`; a wrong id yields a 404 `model not found` from the API.
- **Common Mistakes:** Using a non-existent/typo'd model id; using a cheaper model here (degrades report quality — Opus is intentional).
- **Security Notes:** Not sensitive. Safe in Vercel + GitHub.

### `ANTHROPIC_MODEL_EXTRACTION`
- **Phase Introduced:** Phase 2
- **Status:** `IMPLEMENTED` — `lib/ai/provider.ts:27` (`optionalEnv('ANTHROPIC_MODEL_EXTRACTION', 'claude-haiku-4-5-20251001')`); declared `.env.example:17`
- **Required?** Optional (default). Recommended to pin.
- **Purpose:** Cheap/fast vision model id for screenshot OCR/extraction.
- **Provider:** Anthropic
- **Example Value:** `claude-haiku-4-5-20251001`
- **Verification:** OCR path (`lib/ai/ocr.ts`) returns extracted fields; wrong id → 404.
- **Common Mistakes:** Pointing this at an expensive model (cost creep at volume); using a non-vision model for screenshots.
- **Security Notes:** Not sensitive. Safe everywhere.

---

## Provider: Supabase (Postgres + Auth + Storage)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 3)

> All four Supabase variables are **declared** (`.env.example:20–23`) and required
> by Phase 3 per `COACHSCORE_ROADMAP.md` §10 (P0/P3 deliverables) + ADR 0006, but
> **no code reads them yet** (Phase 3 introduces the Drizzle client + RLS).

**Pricing Tier:** **Free tier** (limited: 1 project paused after inactivity, 500MB DB, 1GB storage, 50k MAU). **Recommended: Pro ~$25/mo** for production (no auto-pause, daily backups, more storage). EU region for GDPR/KVKK (ADR 0006).
**Dashboard Navigation:** `supabase.com/dashboard` → **New project** → (after creation) **Project Settings → API** (URL + keys) and **Project Settings → Database → Connection string** (for `DATABASE_URL`).
**Step-by-Step Creation:**
1. Sign up at `https://supabase.com/dashboard`.
2. **New project** → choose an org, name `coachscore`, set a strong DB password (save it), select an **EU region** (e.g. `eu-central-1`) for GDPR/KVKK residency.
3. Wait for provisioning (~2 min).
4. **Project Settings → API**: copy **Project URL**, **anon public** key, and **service_role** key.
5. **Project Settings → Database → Connection string → URI** (use the **pooler/“Transaction” / port 6543** string for serverless, or the direct string for migrations): copy as `DATABASE_URL`, inserting the DB password.
6. Paste all four into `.env.local`.

### `NEXT_PUBLIC_SUPABASE_URL`
- **Phase:** Phase 3 — Data Intake/Persistence · **Status:** `DECLARED` (`.env.example:20`); `PLANNED_NOT_IMPLEMENTED` in code
- **Required?** Required (Phase 3) · **Purpose:** Base URL of the Supabase project for the client SDK (auth + storage + REST). **Provider:** Supabase
- **Example Value:** `https://abcdefghijklmnop.supabase.co`
- **Verification:** `curl -s $NEXT_PUBLIC_SUPABASE_URL/auth/v1/health` returns ok; dashboard **Project Settings → API** shows the same URL.
- **Common Mistakes:** Using the dashboard URL instead of the project API URL; wrong project.
- **Security Notes:** Public (browser-exposed). Safe in Vercel + GitHub.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Phase:** 3 · **Status:** `DECLARED` (`.env.example:21`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Required (Phase 3) · **Purpose:** Public anon key for client-side auth/queries, gated by **Row-Level Security**. **Provider:** Supabase
- **Example Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<...>`
- **Verification:** A client init succeeds; an unauthenticated query respects RLS (returns only permitted rows).
- **Common Mistakes:** Swapping anon and service_role keys; shipping without RLS enabled (anon key would over-expose data).
- **Security Notes:** Public-by-design **only if RLS is enabled on every table** (ADR + roadmap §9). Safe in Vercel + GitHub.

### `SUPABASE_SERVICE_ROLE_KEY`
- **Phase:** 3 · **Status:** `DECLARED` (`.env.example:22`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Required (Phase 3, server-side) · **Purpose:** Elevated server key that **bypasses RLS** for trusted server actions (snapshot writes, admin ops). **Provider:** Supabase
- **Example Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<service-role>`
- **Verification:** A server-only route can write a row; never reachable from the browser bundle.
- **Common Mistakes:** **Exposing it client-side** (catastrophic — bypasses RLS); putting it behind a `NEXT_PUBLIC_` name.
- **Security Notes:** **Server-only secret.** Vercel (server env, non-public) yes; GitHub Actions only if a server integration test needs it (prefer not in a public repo). Never local-public, never in the client.

### `DATABASE_URL`
- **Phase:** 3 · **Status:** `DECLARED` (`.env.example:23`); `PLANNED_NOT_IMPLEMENTED` (Drizzle client lands in Phase 3)
- **Required?** Required (Phase 3) · **Purpose:** Postgres connection string for Drizzle ORM migrations + queries. **Provider:** Supabase (Postgres)
- **Example Value:** `postgresql://postgres:[PASSWORD]@db.abcdefgh.supabase.co:5432/postgres`
- **Verification:** `pnpm drizzle-kit migrate` (Phase 3) connects + applies migrations; `psql "$DATABASE_URL" -c '\dt'` lists tables.
- **Common Mistakes:** Forgetting to substitute the DB password; using the pooled port for migrations (use direct/5432 for DDL, pooled/6543 for serverless runtime); URL-encoding special characters in the password.
- **Security Notes:** **Server-only secret.** Vercel server env yes; never client; never committed.

---

## Provider: Cloudflare R2 (object storage)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 3)

> Declared `.env.example:26–29`; chosen for **zero egress** (`reports/TECH_DECISIONS.md` “Storage — Cloudflare R2”; `COACHSCORE_ROADMAP.md` §3). No code reads it yet (Phase 3 wires screenshot/PDF storage).

**Pricing Tier:** **Free tier** (10 GB storage, Class A/B operations quotas, **$0 egress**). Paid usage-based beyond. R2 is billed within a Cloudflare account.
**Dashboard Navigation:** `dash.cloudflare.com` → **R2** → **Create bucket**; then **R2 → Manage R2 API Tokens → Create API token**. Account ID: **R2 overview page** (right sidebar) or **Account Home → account ID**.
**Step-by-Step Creation:**
1. Create/log in at `https://dash.cloudflare.com`.
2. **R2** (left nav) → if first time, accept the R2 terms (requires a card on file even for free tier).
3. **Create bucket** → name `coachscore-media` → choose a region/jurisdiction (EU for GDPR/KVKK).
4. Copy the **Account ID** (R2 overview, right side) → `R2_ACCOUNT_ID`.
5. **Manage R2 API Tokens → Create API Token** → permission **Object Read & Write**, scope to the bucket → create → copy **Access Key ID** and **Secret Access Key** (shown once).
6. Paste all four into `.env.local`.

### `R2_ACCOUNT_ID`
- **Phase:** 3 · **Status:** `DECLARED` (`.env.example:26`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Required (Phase 3) · **Purpose:** Identifies the Cloudflare account; forms the S3 endpoint `https://<accountid>.r2.cloudflarestorage.com`. **Provider:** Cloudflare
- **Example Value:** `0123456789abcdef0123456789abcdef`
- **Verification:** Endpoint URL resolves; an S3 client lists the bucket.
- **Common Mistakes:** Confusing account ID with bucket name or token id.
- **Security Notes:** Low sensitivity (not a secret alone). Safe in Vercel server env.

### `R2_ACCESS_KEY_ID`
- **Phase:** 3 · **Status:** `DECLARED` (`.env.example:27`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Required (Phase 3) · **Purpose:** S3-compatible access key id for R2. **Provider:** Cloudflare
- **Example Value:** `a1b2c3d4e5f6a7b8c9d0e1f2`
- **Verification:** `aws s3 ls --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com` (with both keys) lists buckets.
- **Common Mistakes:** Token scoped read-only when writes are needed; wrong bucket scope.
- **Security Notes:** Secret (pairs with the secret key). Server-only; Vercel server env.

### `R2_SECRET_ACCESS_KEY`
- **Phase:** 3 · **Status:** `DECLARED` (`.env.example:28`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Required (Phase 3) · **Purpose:** S3-compatible secret key for R2. **Provider:** Cloudflare
- **Example Value:** `wJalrXUtnFEMI8K7MDENGbPxRfiCYEXAMPLEKEY12`
- **Verification:** Same `aws s3 ls` smoke test succeeds.
- **Common Mistakes:** Not copying it at creation (shown once); leaking in logs.
- **Security Notes:** **Server-only secret.** Vercel server env; never client; never committed; rotate if exposed.

### `R2_BUCKET`
- **Phase:** 3 · **Status:** `DECLARED` (`.env.example:29`, default `coachscore-media`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Optional (default provided) · **Purpose:** Target bucket name for screenshots, PDFs, and later video. **Provider:** Cloudflare
- **Example Value:** `coachscore-media`
- **Verification:** Bucket exists in the R2 dashboard and matches.
- **Common Mistakes:** Mismatch between env value and the created bucket name.
- **Security Notes:** Not sensitive. Safe everywhere.

---

## Provider: Clash of Clans API (via fixed-IP proxy)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 3, optional)

> Declared `.env.example:49–50`. **One of three intake paths** (tag/screenshot/manual) and **never the sole dependency** (ADR 0006; `COACHSCORE_ROADMAP.md` §3 “CoC data (optional)”). Public data only.

**Pricing Tier:** Free (developer API), but keys are **“non-commercial” + IP-whitelisted** — gray for paid use; the proxy is a small VPS (~$5/mo).
**Dashboard Navigation:** `developer.clashofclans.com` → **My Account → Create New Key** (bind to your proxy’s fixed IP).
**Step-by-Step Creation:**
1. Log in at `https://developer.clashofclans.com` (Supercell ID).
2. Stand up a fixed-IP proxy (small VPS) — note its public IP.
3. **My Account → Create New Key** → name `coachscore-proxy`, **allowed IP = the VPS IP** → create → copy the token.
4. Set `COC_API_TOKEN` (the key) and `COC_API_PROXY_URL` (your proxy base URL) in `.env.local`.
5. Keep usage to **public** data; carry the unofficial disclaimer (ADR 0006).

### `COC_API_TOKEN`
- **Phase:** 3 (optional) · **Status:** `DECLARED` (`.env.example:49`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** **Optional** (Recommended for the lowest-friction tag-lookup path; the product works without it via screenshot/manual) · **Purpose:** Auth token for public player/clan lookups via the proxy. **Provider:** Supercell (CoC developer API)
- **Example Value:** `eyJ0eXAiOiJKV1QiLCJhbGciOiJ...` (JWT)
- **Verification:** From the proxy IP: `curl -H "Authorization: Bearer $COC_API_TOKEN" "https://api.clashofclans.com/v1/players/%23TAG"` returns 200 (403 = IP not whitelisted).
- **Common Mistakes:** Key not bound to the proxy IP (403 from elsewhere); using it for non-public/commercial SaaS (policy risk); calling directly from serverless (rotating IPs → 403 — must go through the fixed-IP proxy).
- **Security Notes:** Server/proxy-only secret. Never client; store on the proxy + Vercel server env. Treat as gray-area: keep human-in-the-loop framing (ADR 0005/0006).

### `COC_API_PROXY_URL`
- **Phase:** 3 (optional) · **Status:** `DECLARED` (`.env.example:50`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Optional (required only if using the API path) · **Purpose:** Base URL of the fixed-IP compliant proxy that fronts the CoC API. **Provider:** self-hosted (Cloudflare/Fly/VPS)
- **Example Value:** `https://coc-proxy.coachscore.app`
- **Verification:** `curl $COC_API_PROXY_URL/health` returns ok; a tag lookup through it succeeds.
- **Common Mistakes:** Proxy IP not whitelisted on the key; missing TLS; no rate limiting (abuse/cost).
- **Security Notes:** The URL itself is low-sensitivity; the proxy must hold the token securely and enforce rate limits.

---

## Provider: Stripe (payments)  ·  `IMPLEMENTED_BUT_NOT_ACTIVATED` (Phase 4; Connect in Phase 5)

> Declared `.env.example:32–34`. **Read by code (Phase 4):** `lib/payments/stripe-adapter.ts` (Checkout session via the Stripe REST API), `lib/payments/signature.ts` (webhook signature verification), `lib/api/checkout-handler.ts` + `lib/api/webhook-handler.ts`, and the routes `app/api/checkout`, `app/api/stripe/webhook`. The hosted-checkout redirect flow needs the **secret** + **webhook** keys; the publishable key is only required if you later add Stripe.js Elements. Until the keys are set, checkout returns HTTP 503 `not_activated`.

**Pricing Tier:** **No monthly fee**; per-transaction **~2.9% + $0.30** (US cards). Connect (Phase 5) adds payout/account fees. Test mode is free.
**Dashboard Navigation:** `dashboard.stripe.com` → **Developers → API keys** (secret + publishable); **Developers → Webhooks → Add endpoint** (signing secret); **Connect → Settings** (Phase 5).
**Step-by-Step Creation:**
1. Create/log in at `https://dashboard.stripe.com`; complete business activation for live mode (test mode works immediately).
2. **Developers → API keys**: copy **Secret key** (`sk_test_…` / `sk_live_…`) → `STRIPE_SECRET_KEY`; copy **Publishable key** (`pk_test_…`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. **Developers → Webhooks → Add endpoint** → URL `https://<app>/api/stripe/webhook`, select events (e.g. `checkout.session.completed`) → create → reveal **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.
4. For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (prints a `whsec_…` for local use).
5. Paste into `.env.local`.

### `STRIPE_SECRET_KEY`
- **Phase:** 4 · **Status:** `IMPLEMENTED_BUT_NOT_ACTIVATED` — `lib/payments/stripe-adapter.ts` (`StripePaymentProvider`/`createStripeProvider`); declared `.env.example:32`
- **Required?** Required (Phase 4) · **Purpose:** Server-side key to create Checkout sessions, charges, and (P5) Connect transfers. **Provider:** Stripe
- **Example Value:** `sk_test_51Xxxxxxxxxxxxxxxxxxxxxxxx`
- **Verification:** `curl https://api.stripe.com/v1/balance -u "$STRIPE_SECRET_KEY:"` returns 200; a test Checkout session can be created.
- **Common Mistakes:** **Using the publishable key (`pk_`) where the secret (`sk_`) is required**; mixing test vs live keys across environments; committing the live key.
- **Security Notes:** **Server-only secret.** Vercel server env; never client; never in a public repo. Use **restricted keys** where possible; rotate on exposure.

### `STRIPE_WEBHOOK_SECRET`
- **Phase:** 4 · **Status:** `IMPLEMENTED_BUT_NOT_ACTIVATED` — `lib/payments/signature.ts` (`verifyWebhookSignature`) via `lib/api/payment-wire.ts`; declared `.env.example:33`
- **Required?** Required (Phase 4) · **Purpose:** Verifies inbound webhook signatures so order state can only be advanced by genuine Stripe events. **Provider:** Stripe
- **Example Value:** `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Verification:** `stripe trigger checkout.session.completed` → the webhook route validates the signature (200), rejects a tampered body (400).
- **Common Mistakes:** Using the **dashboard** signing secret for **local** `stripe listen` (they differ); wrong endpoint URL; not raw-body parsing the webhook (signature fails).
- **Security Notes:** Server-only secret; per-endpoint + per-environment. Vercel server env.

### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Phase:** 4 · **Status:** `DECLARED` (`.env.example:34`) — not required by the current hosted-checkout redirect flow; needed only if Stripe.js Elements is added later
- **Required?** Required (Phase 4, client) · **Purpose:** Client-side key for Stripe.js / Checkout redirect. **Provider:** Stripe
- **Example Value:** `pk_test_51Xxxxxxxxxxxxxxxxxxxxxxxx`
- **Verification:** Stripe.js initializes; Checkout opens in the browser.
- **Common Mistakes:** Putting the **secret** key behind this public name (severe leak); test/live mismatch with the secret key.
- **Security Notes:** Public-by-design (publishable). Safe in Vercel + GitHub. Must always pair (test↔test / live↔live) with the matching secret key.

---

## Provider: Resend (transactional + lifecycle email)  ·  `IMPLEMENTED_BUT_NOT_ACTIVATED` (Phase 4)

> Declared `.env.example:45–46`. **Read by code (Phase 4):** `lib/email` (templates + `ResendEmailProvider`/`createResendProvider` + the delivery pipeline that records `email_deliveries`). Lifecycle/re-engagement email is Phase 7.

**Pricing Tier:** **Free tier** (~3,000 emails/mo, 100/day, 1 domain). Paid from ~$20/mo for higher volume + multiple domains.
**Dashboard Navigation:** `resend.com` → **API Keys → Create API Key**; **Domains → Add Domain** (DNS records for deliverability).
**Step-by-Step Creation:**
1. Sign up at `https://resend.com`.
2. **Domains → Add Domain** → `coachscore.app` → add the shown **SPF/DKIM/DMARC** DNS records at your registrar → verify.
3. **API Keys → Create API Key** → name `coachscore`, permission **Sending access**, scope to the domain → copy `re_…`.
4. Paste into `.env.local` as `RESEND_API_KEY`.

### `RESEND_API_KEY`
- **Phase:** 4 · **Status:** `IMPLEMENTED_BUT_NOT_ACTIVATED` — `lib/email/resend-adapter.ts` (`createResendProvider`); declared `.env.example:45`
- **Required?** Required (Phase 4 — report delivery) · **Purpose:** Auth for sending transactional (report ready) + lifecycle (re-engagement) email. **Provider:** Resend
- **Example Value:** `re_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Verification:** `curl -X POST https://api.resend.com/emails -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d '{"from":"noreply@coachscore.app","to":"you@example.com","subject":"test","text":"hi"}'` returns an id; dashboard **Logs** shows the send.
- **Common Mistakes:** Sending from an unverified domain (blocked / spam); missing DKIM (poor deliverability); using a sending key with the wrong scope.
- **Security Notes:** Server-only secret. Vercel server env; never client.

### `RESEND_FROM_EMAIL`
- **Phase:** 4 · **Status:** `IMPLEMENTED_BUT_NOT_ACTIVATED` — `lib/email/resend-adapter.ts` (`optionalEnv('RESEND_FROM_EMAIL', …)`); declared `.env.example:46`
- **Required?** Optional (has a default) · **Purpose:** Verified "From" name + address for transactional email. **Provider:** Resend
- **Example Value:** `CoachScore <noreply@coachscore.app>`
- **Verification:** A delivered email shows this sender; the domain must be verified in Resend.
- **Common Mistakes:** Using an unverified domain (blocked/spam); malformed display-name format.
- **Security Notes:** Not a secret. Safe in Vercel + GitHub.

---

## Provider: PostHog (product analytics + experiments)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 7)

> Declared `.env.example:41–42`; `COACHSCORE_ROADMAP.md` §3/§11 (the experimentation system). No code yet (Phase 4 can start basic events; the framework is Phase 7).

**Pricing Tier:** **Free tier** (generous — ~1M events/mo, session replay quota, feature flags). Usage-based beyond. EU cloud host for GDPR/KVKK.
**Dashboard Navigation:** `posthog.com` (choose **EU** region) → **Project Settings → Project API Key**; host is the EU ingestion URL.
**Step-by-Step Creation:**
1. Sign up at `https://posthog.com` and select the **EU** cloud (GDPR/KVKK).
2. Create project `coachscore`.
3. **Project Settings** → copy the **Project API Key** (`phc_…`) → `NEXT_PUBLIC_POSTHOG_KEY`.
4. Set `NEXT_PUBLIC_POSTHOG_HOST` to the EU host (default already `https://eu.posthog.com`).
5. Paste into `.env.local`.

### `NEXT_PUBLIC_POSTHOG_KEY`
- **Phase:** 7 (events can begin Phase 4) · **Status:** `DECLARED` (`.env.example:41`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Recommended (analytics/experiments are core to conversion optimization, §11) · **Purpose:** Client project key to capture funnel events, run A/B experiments, and feature flags. **Provider:** PostHog
- **Example Value:** `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Verification:** Browser network tab shows events POSTing to the host; PostHog **Activity** shows live events.
- **Common Mistakes:** Using the personal API key instead of the project key; wrong region host (US key + EU host); capturing PII into events (GDPR/KVKK).
- **Security Notes:** Public-by-design (client key, capture-only). Safe in Vercel + GitHub. Keep PII out of event payloads.

### `NEXT_PUBLIC_POSTHOG_HOST`
- **Phase:** 7 · **Status:** `DECLARED` (`.env.example:42`, default `https://eu.posthog.com`); `PLANNED_NOT_IMPLEMENTED`
- **Required?** Optional (default EU) · **Purpose:** Ingestion endpoint; pin EU for residency. **Provider:** PostHog
- **Example Value:** `https://eu.posthog.com`
- **Verification:** Events arrive in the EU project.
- **Common Mistakes:** Pointing an EU key at the US host (events dropped).
- **Security Notes:** Public, non-sensitive.

---

## Provider: Inngest (durable queue)  ·  `SUPERSEDED` / `PLANNED_NOT_IMPLEMENTED`

> `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` are declared `.env.example:37–38`,
> but **Phase 2 replaced Inngest with an in-house durable queue** (`lib/queue/`,
> see `docs/EXECUTION_STATUS.md` Phase 2). There are **0 Inngest references in
> code** (`package.json` has no `inngest` dependency). These variables are
> therefore **not needed today**.

**Pricing Tier:** Free tier exists; only relevant if a hosted durable transport is reintroduced.
**Dashboard Navigation:** (if adopted) `app.inngest.com` → **Manage → Keys**.

### `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`
- **Phase:** (originally Phase 2) · **Status:** `SUPERSEDED` — replaced by `lib/queue`; remain in `.env.example` only as a future option
- **Required?** **Not required.** The queue runner (`lib/queue/runner.ts`) provides idempotency/retry/backoff/dead-letter with no external service.
- **Purpose (if re-adopted):** Auth + webhook signing for a hosted Inngest transport behind the existing `QueueStore` interface.
- **Provider:** Inngest · **Example Value:** `signkey-prod-xxxxx`
- **Verification:** N/A today.
- **Common Mistakes:** Re-adding Inngest without removing the in-house runner (two queues).
- **Security Notes:** Server-only secret *if adopted*. **Recommendation:** remove these from `.env.example` (or keep with a clear “unused — see lib/queue” comment) to avoid confusion. Until then, leave blank.

---

## Provider: Sentry (error monitoring)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 0/8 observability)

> **Not in `.env.example`.** Referenced in `reports/TECH_DECISIONS.md` (“Observability — Sentry”) and `COACHSCORE_ROADMAP.md` §3 (Observability row, line 112) + P0 deliverables (“Sentry + uptime + structured logging”, line 387). Add the variable to `.env.example` when wired.

**Pricing Tier:** **Free/Developer tier** (limited errors/mo). Team ~$26/mo for more volume + retention.
**Dashboard Navigation:** `sentry.io` → **Projects → Create Project** (platform: Next.js) → **Settings → Client Keys (DSN)**.
**Step-by-Step Creation:**
1. Sign up at `https://sentry.io`.
2. **Create Project** → platform **Next.js** → name `coachscore`.
3. **Settings → Client Keys (DSN)** → copy the **DSN**.
4. Add `SENTRY_DSN` (and for source-map upload in CI, `SENTRY_AUTH_TOKEN` from **Settings → Auth Tokens**) to `.env.local`/CI.

### `SENTRY_DSN` *(PLANNED_NOT_IMPLEMENTED)*
- **Phase:** 0/8 (observability) · **Status:** `PLANNED_NOT_IMPLEMENTED` (doc-referenced; not in code/.env.example)
- **Required?** Recommended (the roadmap calls error visibility “non-negotiable”) · **Purpose:** Ingestion endpoint for client/server error + performance events. **Provider:** Sentry
- **Example Value:** `https://abc123@o12345.ingest.sentry.io/67890`
- **Verification:** A thrown test error appears in the Sentry **Issues** stream.
- **Common Mistakes:** Treating the DSN as a high-secret (it’s low-sensitivity ingest); not uploading source maps (unreadable stack traces).
- **Security Notes:** DSN is low-sensitivity (safe public). `SENTRY_AUTH_TOKEN` (CI source-map upload) **is** secret → GitHub Actions secret / Vercel server env only.

---

## Provider: Plausible (privacy-friendly traffic/SEO analytics)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 4/7)

> **Not in `.env.example`.** Referenced in `COACHSCORE_ROADMAP.md` §3 (Analytics row) + `reports/TECH_DECISIONS.md` (“Analytics & Experimentation — PostHog + Plausible”). Add when wired.

**Pricing Tier:** **Paid** cloud (~$9/mo starter) **or self-host free**. GDPR/KVKK-friendly (no cookies).
**Dashboard Navigation:** `plausible.io` → **Add a website** → use the site **domain** as the data-domain.
**Step-by-Step Creation:** sign up → **Add a website** → enter `coachscore.app` → set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=coachscore.app` and include the Plausible script.

### `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` *(PLANNED_NOT_IMPLEMENTED)*
- **Phase:** 4/7 · **Status:** `PLANNED_NOT_IMPLEMENTED`
- **Required?** Optional (Recommended for SEO/traffic visibility) · **Purpose:** The data-domain that ties the Plausible script to your site. **Provider:** Plausible
- **Example Value:** `coachscore.app`
- **Verification:** Plausible dashboard shows live visitors.
- **Common Mistakes:** Domain mismatch (no data); double-counting with PostHog (use each for its purpose).
- **Security Notes:** Public, non-sensitive.

---

## Provider: Better Stack (uptime/heartbeat)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 0/8)

> **Not in `.env.example`.** Referenced in `COACHSCORE_ROADMAP.md` §3 (Observability — “uptime (Better Stack)”). Typically a monitor watching `/api/health`; a heartbeat URL may be stored as an env var for cron checks.

**Pricing Tier:** **Free tier** (limited monitors). Paid for more monitors/SMS.
**Dashboard Navigation:** `betterstack.com` → **Uptime → Create monitor** (URL `https://<app>/api/health`).
**Step-by-Step Creation:** sign up → **Create monitor** → point at `/api/health` → set alert contacts. (Heartbeat URL only needed if a cron pings Better Stack.)

### `BETTERSTACK_HEARTBEAT_URL` *(PLANNED_NOT_IMPLEMENTED)*
- **Phase:** 0/8 · **Status:** `PLANNED_NOT_IMPLEMENTED`
- **Required?** Optional · **Purpose:** Cron/heartbeat endpoint to confirm scheduled jobs ran (e.g., the reference-table patch-watcher). **Provider:** Better Stack
- **Example Value:** `https://uptime.betterstack.com/api/v1/heartbeat/xxxxxxxx`
- **Verification:** Missing a heartbeat triggers an alert.
- **Common Mistakes:** Monitoring the marketing page instead of `/api/health`.
- **Security Notes:** Treat the heartbeat URL as a low-grade secret (anyone with it can fake a heartbeat). Server/CI only.

---

## Provider: Stripe Connect + Wise/Payoneer (coach payouts)  ·  `PLANNED_NOT_IMPLEMENTED` (Phase 5)

> **Not in `.env.example`.** Referenced in `COACHSCORE_ROADMAP.md` §3 (“Connect (P2 coach payouts); Payoneer/Wise fallback”) + `reports/TECH_DECISIONS.md` “Payments — Stripe (Checkout → Connect) + Payoneer/Wise fallback” + §10 Phase 5.

**Pricing Tier:** Connect: per-payout + account fees. Wise/Payoneer: per-transfer fees (used where Connect coverage is thin — India/SEA/MENA).
**Dashboard Navigation:** Stripe **Connect → Settings → Integration** (platform/client id); Wise: `wise.com` business → **Settings → API tokens**; Payoneer: partner/API program.
**Step-by-Step Creation (high level):** enable **Connect** in the Stripe dashboard; obtain the Connect client id; for fallback rails, apply for Wise/Payoneer business API access and create tokens.

### `STRIPE_CONNECT_CLIENT_ID` *(PLANNED_NOT_IMPLEMENTED)*
- **Phase:** 5 · **Required?** Required (Phase 5 payouts) · **Purpose:** Onboard coaches as connected accounts + route payouts. **Provider:** Stripe Connect
- **Example Value:** `ca_Xxxxxxxxxxxxxxxxxxxxxxxx` · **Security:** Server-only; Vercel server env.

### `WISE_API_TOKEN` / `PAYONEER_API_KEY` *(PLANNED_NOT_IMPLEMENTED)*
- **Phase:** 5 · **Required?** Optional fallback (regions where Connect is thin) · **Purpose:** Cross-border coach payouts. **Provider:** Wise / Payoneer
- **Example Value:** `wise_live_xxxxxxxx` · **Security:** **Server-only secrets** (move money) — strict access, Vercel server env, rotate aggressively, never in a public repo.
- **Common Mistakes:** Sandbox vs live token mixups; missing business verification (KYC) before live transfers.

---

## Operational platforms (not app `.env` variables)

### Vercel (hosting)  ·  `IMPLEMENTED` (deploy target) / config
- **Pricing Tier:** **Hobby free**; **Pro ~$20/user/mo** for production/teams.
- **Dashboard Navigation:** `vercel.com` → **Add New → Project → Import** the GitHub repo → **Settings → Environment Variables** (set all server/public vars per environment).
- **Variables:** Vercel stores the above app variables per environment (Production/Preview/Development). Optional CLI/CI deploy tokens: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (**`PLANNED_NOT_IMPLEMENTED`** — only if deploying via CI instead of the Git integration). `VERCEL_TOKEN` is a **secret** (GitHub Actions secret).
- **Verification:** A push to `main` produces a deployment; `/api/health` responds on the deployment URL.
- **Security Notes:** Set `ANTHROPIC_API_KEY`, Supabase service key, Stripe secret, Resend, R2 secrets as **non-public** server env; set `NEXT_PUBLIC_*` as public.

### GitHub (source + CI/CD)  ·  `IMPLEMENTED`
- **Pricing Tier:** **Free** (public repo → unlimited Actions minutes; this repo is public).
- **Dashboard Navigation:** repo → **Settings → Secrets and variables → Actions** (add CI secrets); **Settings → Branches** (optional protection).
- **Variables:** `GITHUB_TOKEN` is **auto-provided** to workflows (no setup). Optionally add secrets like `SENTRY_AUTH_TOKEN` or `VERCEL_TOKEN` for CI. **Do not** add `ANTHROPIC_API_KEY`/payment secrets to a **public** repo’s Actions secrets (see ADR-aligned posture; the live AI test self-skips in CI).
- **Verification:** `gh run list` shows green workflows; secrets are usable by same-repo workflows (not fork PRs).
- **Security Notes:** Public repo → fork PRs do **not** receive secrets (good). Keep paid-API secrets out of CI on a public repo.

---

# Phase-by-Phase Checklist

Each phase lists the variables that **must** be obtained before starting it.
(✅ = available now in `.env`; ⛔ = must obtain.)

### Phase 0 — Foundation
- None required. `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_ENV` optional (defaults). ✅

### Phase 1 — Deterministic Scoring Engine
- None (pure logic). ✅

### Phase 2 — AI Pipeline  ✅ (current)
- `ANTHROPIC_API_KEY` ✅ (provided) · `ANTHROPIC_MODEL_REASONING` / `ANTHROPIC_MODEL_EXTRACTION` optional ✅

### Phase 3 — Data Intake / Persistence  🟡 IMPLEMENTED_BUT_NOT_ACTIVATED
- `NEXT_PUBLIC_SUPABASE_URL` ⛔ · `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⛔ · `SUPABASE_SERVICE_ROLE_KEY` ⛔ · `DATABASE_URL` ⛔
- `R2_ACCOUNT_ID` ⛔ · `R2_ACCESS_KEY_ID` ⛔ · `R2_SECRET_ACCESS_KEY` ⛔ · `R2_BUCKET` (default ok)
- `COC_API_TOKEN` / `COC_API_PROXY_URL` ⛔ optional (tag-lookup path)

### Phase 4 — Web Product / Payments  🟡 IMPLEMENTED_BUT_NOT_ACTIVATED
- Report/teaser/PDF/share + pricing work **with no credentials**.
- `STRIPE_SECRET_KEY` ⛔ · `STRIPE_WEBHOOK_SECRET` ⛔ (checkout + webhooks) · `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional, only for Stripe.js Elements)
- `RESEND_API_KEY` ⛔ · `RESEND_FROM_EMAIL` (optional, default provided) — email delivery
- (recommended) `SENTRY_DSN` ⛔ PLANNED · `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` ⛔ PLANNED

### Phase 5 — Coach Marketplace
- `STRIPE_CONNECT_CLIENT_ID` ⛔ PLANNED · `WISE_API_TOKEN` / `PAYONEER_API_KEY` ⛔ PLANNED (fallback)

### Phase 6 — Additional SKUs (ReplayDoctor/BaseDoctor/WarPlan)
- Reuses existing rails (Supabase, R2, Stripe, Anthropic). R2 video usage grows. No new providers.

### Phase 7 — Growth Infrastructure
- `NEXT_PUBLIC_POSTHOG_KEY` ⛔ · `NEXT_PUBLIC_POSTHOG_HOST` (default ok) · `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` ⛔ PLANNED
- (P7 localization) local payment provider keys (UPI/GoPay) ⛔ PLANNED — via Stripe or a local PSP

### Phase 8 — Optimization / Data Moat
- No new credentials. `pgvector` runs inside Supabase (no new vendor — `reports/TECH_DECISIONS.md`). Optional fine-tuning uses the existing `ANTHROPIC_API_KEY`.

### Phase 9 — Production Readiness
- No new credentials. Ensure **all** secrets are set in Vercel (Production), Sentry/uptime live, and the reference-data readiness gate passes for served Town Halls.

---

# Estimated Monthly Cost

Grounded in `COACHSCORE_ROADMAP.md` §8 (AI ~$0.30–$0.48/report; early infra
~$50–$300/mo) and `reports/MONETIZATION_ANALYSIS.md` (volumes per scenario).
Figures are planning estimates, not quotes; AI/payment costs **scale with revenue**.

| Stage | Reports/mo | Anthropic (AI) | Supabase | R2 | Vercel | PostHog/Plausible/Sentry | Stripe fees | **Est. total/mo** |
|-------|-----------|----------------|----------|-----|--------|--------------------------|-------------|-------------------|
| **MVP** (pre-revenue, Phases 0–2) | ~0–50 | ~$0–$25 | Free | Free | Free (Hobby) | Free | $0 | **~$0–$50** |
| **Early traction** (Phases 3–4 live) | ~120–500 | ~$40–$240 | ~$25 (Pro) | ~$0–$5 | ~$20 (Pro) | ~$0–$35 | ~2.9%+$0.30/txn | **~$120–$350 + fees** |
| **1,000 users** (~1,300 reports/mo, multi-SKU) | ~1,300 | ~$400–$620 | ~$25–$75 | ~$5–$20 | ~$20–$40 | ~$0–$50 (free tiers hold) | ~$0.65/txn ≈ $850 | **~$1.3K–$1.7K + payouts** |
| **10,000 users** (~5k–12k reports/mo, localized) | ~5,000–12,000 | ~$1.5K–$5K | ~$75–$300 | ~$20–$100 | ~$40–$150 | ~$50–$300 | scales w/ GMV | **~$2K–$6K + coach payouts** |

Notes:
- **AI cost scales with paid volume** (≈3–4% of a $12 report) — it grows with revenue, so margin holds (`COACHSCORE_ROADMAP.md` §7/§8).
- **Coach payouts (Phase 5)** are ~60% of human-tier price — the dominant variable cost at scale, not infra.
- **R2 zero-egress** keeps media cheap even at video scale (Phase 6).
- Free tiers (Supabase before Pro, PostHog ~1M events, Resend ~3k emails, Sentry dev) cover MVP/early stages; upgrade per the thresholds above.

---

# Maintenance notes

- **Remove or annotate `INNGEST_*`** in `.env.example` — superseded by `lib/queue` (avoid future confusion).
- **Add when wiring:** `SENTRY_DSN` (+ `SENTRY_AUTH_TOKEN`), `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `BETTERSTACK_HEARTBEAT_URL`, `STRIPE_CONNECT_CLIENT_ID`, `WISE_API_TOKEN`/`PAYONEER_API_KEY`, and any `VERCEL_*` CI tokens — currently `PLANNED_NOT_IMPLEMENTED`.
- **Secret storage rule:** anything that is not `NEXT_PUBLIC_*` is a server-only secret → Vercel server env + local `.env.local`/`.env`; **never** in a public repo’s Actions secrets and **never** in the client bundle.

*This material is unofficial and is not endorsed by Supercell. Not legal advice — review Supercell's ToS, Fan Content Policy, and API terms, plus each provider's terms and your GDPR/KVKK obligations, before going live.*
