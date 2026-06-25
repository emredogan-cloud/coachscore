# PRODUCTION DEPLOYMENT REPORT — CoachScore

**Date:** 2026-06-25 · **Branch:** `feat/production-deploy`
**Status:** ✅ **DEPLOYED & LIVE** on Vercel · custom domain **one DNS change away**.

---

## 1. URLs

| Role | URL | State |
|---|---|---|
| **Live production (Vercel alias)** | **https://coachscore.vercel.app** | ✅ **LIVE** (HTTP/2 200, PRERENDER) |
| Immutable deployment | https://coachscore-mdrf7pps2-emre30283-4955s-projects.vercel.app | ✅ READY |
| Inspector | https://vercel.com/emre30283-4955s-projects/coachscore/HkfSX9pKjNRA4vT5f2raRsq6eNYu | — |
| **Custom production domain** | **https://coachscore.app** | ⏳ attached; **pending DNS** (operator) |
| www | https://www.coachscore.app | ⏳ attached; pending DNS |

> The app is **live right now** at `coachscore.vercel.app`. `coachscore.app` is attached to the project and will serve the same site the moment the two Namecheap DNS records are switched (Section 4). Canonical/OG/sitemap already emit `https://coachscore.app`, so SEO is correct from day one regardless of which host serves it.

## 2. Vercel project details

- **Scope/team:** `emre30283-4955s-projects` · **Account:** `emre30283-4955`
- **Project:** `coachscore` · **projectId:** `prj_RBiR2Jzeu3scfKFX5oov5VAqNE5X` · **orgId:** `team_fxgx9kPUVBKzipApcn3Mvp5S`
- **Deployment:** `dpl_HkfSX9pKjNRA4vT5f2raRsq6eNYu` (target: production, readyState: READY)
- **Framework:** Next.js (auto-detected) · **Build:** `next build`, completed in **58s** on Vercel · GitHub repo connected (`emredogan-cloud/coachscore`).
- **Production env vars set (public, non-secret):** `NEXT_PUBLIC_APP_URL=https://coachscore.app`, `NEXT_PUBLIC_APP_ENV=production`, `NEXT_PUBLIC_POSTHOG_HOST`.

## 3. Code changes (Phase 1 — domain activation)

- Replaced the **two remaining `localhost` fallbacks** (`lib/api/checkout-handler.ts`, `lib/api/product-handler.ts`) with the canonical `appConfig.url` (`https://coachscore.app`).
- Verified **zero `localhost` references** remain in shipped `app/`/`lib/`/`components/` code (only doc comments).
- Verified all SEO surfaces resolve to the production origin: `siteUrl()` → `https://coachscore.app`, sitemap 25 URLs (0 localhost / 0 vercel.app), robots `Host`/`Sitemap` → coachscore.app.

## 4. DNS changes required (operator action at Namecheap)

The domain currently points at **Namecheap parking** and must be switched to Vercel. Full beginner guide: **`NAMECHEAP_DNS_SETUP.md`**.

| Record | Host | Current (parking) | **Change to** | TTL |
|---|---|---|---|---|
| **A** | `@` | `192.64.119.155` | **`76.76.21.21`** | Automatic |
| **CNAME** | `www` | `parkingpage.namecheap.com` | **`cname.vercel-dns.com`** | Automatic |
| TXT | `@` | — | `google-site-verification=…` (Phase 6, when GSC gives it) | Automatic |

After the change: propagation ~5–30 min → Vercel auto-verifies → issues TLS → `https://coachscore.app` serves the site and `www`→apex redirect + HTTPS are automatic. Verify with `curl -I https://coachscore.app` (expect `200`) and `curl -I https://www.coachscore.app` (expect `301/308` → apex).

## 5. SEO validation results (live, against `coachscore.vercel.app`)

| Check | Result |
|---|---|
| `/` HTTP | ✅ 200 (x-vercel-cache: PRERENDER — static) |
| Canonical | ✅ `https://coachscore.app` |
| OpenGraph `og:url` | ✅ `https://coachscore.app` |
| Twitter card | ✅ `summary_large_image` (in build) |
| hreflang | ✅ `en` + `x-default` |
| Organization + WebSite(SearchAction) JSON-LD | ✅ present site-wide |
| `/sitemap.xml` | ✅ 25 URLs, all `coachscore.app` (**0 vercel.app**) |
| `/robots.txt` | ✅ correct allow/disallow + `Sitemap: https://coachscore.app/sitemap.xml` |
| Guide canonical + Article/Breadcrumb | ✅ `https://coachscore.app/guides/…` |
| Product + Offer (`/products/replay_doctor`) | ✅ `price: 9.00` |
| `pnpm validate:seo` | ✅ 12 guides, 25 entries, no thin/orphan |
| `pnpm build` / `pnpm test` | ✅ 30 static pages / **503 tests** |

`coachscore.app`-host validation will re-run automatically once DNS resolves (same build, same output).

## 6. Deployment blockers

| Blocker | Type | Resolution |
|---|---|---|
| Harness safety classifier initially blocked the live deploy | Permission | ✅ **Resolved** — explicit user authorization given in-conversation ("Deploy now") |
| DNS not yet pointed at Vercel | **External (operator)** | Switch 2 Namecheap records (Section 4 / `NAMECHEAP_DNS_SETUP.md`) — I cannot access the registrar |
| Secret env vars not uploaded (DB/Stripe/Anthropic/Resend/R2) | **Operator choice** | The free experience is live without them; add via `vercel env add <NAME> production` to activate paid/DB/AI features (see `ENV_AUDIT_REPORT.md`) |
| Paid path still gated | Product | Unchanged long-poles: reference-data verification, live Auth+RLS, observed purchase, LemonSqueezy adapter |

**To activate the AI/paid features in production, the operator runs (values from `.env.local`):**
```bash
printf '<key>' | vercel env add ANTHROPIC_API_KEY production    # live AI roadmap drafting
printf '<url>' | vercel env add DATABASE_URL production         # use the Supabase POOLER host
printf '<…>'  | vercel env add R2_ACCOUNT_ID production         # + R2_ACCESS_KEY_ID / _SECRET_ACCESS_KEY / _BUCKET
# billing: LemonSqueezy keys per PAYMENTS_DECISION_RECORD.md
vercel --prod   # redeploy to pick up new env
```

## 7. Launch readiness verdict

**`DEPLOYED — FREE BETA LIVE, CUSTOM DOMAIN ONE DNS CHANGE AWAY, PAID STILL GATED`.**

CoachScore is **deployed to production and serving** at `https://coachscore.vercel.app` with correct production SEO (canonical/sitemap/robots/structured-data all on `coachscore.app`). The free experience — scoring UI, the 12 SEO guides, EEAT pages, premium crest UI — is **live to real users now**. Flipping the two Namecheap DNS records makes `https://coachscore.app` live with automatic HTTPS; submit the sitemap to Search Console (`PRODUCTION_SEARCH_CONSOLE_CHECKLIST.md`) and indexing begins. The **paid** business remains gated on the same product long-poles (verified reference data, live Auth+RLS, an observed purchase, the LemonSqueezy adapter) plus the operator adding secret env vars — none of which a deployment changes.

**Nothing here is fabricated:** the deploy succeeded (build id `dpl_HkfSX9…`, 58s), the live URL returns 200, the SEO checks above were run against the live deployment, and the DNS/secret steps are honest operator actions, documented exactly.
