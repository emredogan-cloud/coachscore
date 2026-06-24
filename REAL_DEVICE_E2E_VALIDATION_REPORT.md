# Real-Device End-to-End Validation Report — CoachScore

**Date:** 2026-06-24 · **Tester:** autonomous agent · **Build:** production (`next build`) from `main` @ `202dcd2` + 2 fixes from this session.

> **Brutally honest TL;DR:** The product runs cleanly on the physical device — every screen renders, no crashes/ANRs, the free teaser + deterministic scoring + AI product analysis genuinely work. But CoachScore is a **web app / PWA, not a native APK** (by design, ADR-0006), and validation surfaced **2 real runtime bugs** (now fixed) plus confirmed the standing launch blockers. **Verdict: `LIMITED_BETA_ONLY`.**

---

## 1. Device information
| | |
|---|---|
| Model | **Xiaomi 22095RA98C** (Redmi Note 12 family) |
| Manufacturer | Xiaomi |
| Android | **13** (SDK 33) |
| Screen | **1080 × 2408 px @ 440 dpi** (≈ 393 × 876 CSS px, DPR ~2.75) |
| Browser | Chrome (`com.android.chrome`) + WebView + Mi Browser |
| Connection | USB, `adb` device `jfzxugsgnnvsrsg6` (verified `adb devices`) |

## 2. "APK" build information — IMPORTANT CLARIFICATION
There is **no APK and there should not be one.** CoachScore is a **Next.js 15 web app / installable PWA** — ADR-0006 deliberately chose web-first (no app store, no 30% tax, no IAP). The repo has no `android/`, no Capacitor/Expo/React-Native, and the only build command is `next build`. 

I therefore validated the **production web build served to the real device's browser**, which is the faithful real-device test for this product:
- `pnpm build` → ✅ clean (25 routes; static/SSG where possible).
- `pnpm start` (prod server) + `adb reverse tcp:3000 tcp:3000` → device reaches the app (HTTP 200, verified by device-side `curl` **and** Chrome).
- **Real-device proof:** `screenshots/device-home-real.png` is an actual `adb screencap` of the app running in Chrome on the Xiaomi.
- The PWA is installable (`/manifest.webmanifest` served; service worker + offline shell present).

No external calls were faked; where a credential/data was missing, the real behavior was observed and reported.

## 3. Screens tested & screenshots captured (24)
All 20 app routes + interaction/loading/offline states, captured at the device viewport (`screenshots/`):
`home`, `onboarding`, `onboarding-step-1`, `intake`, `report`, `report-state`, `pricing`, `products-hub`, `product-replay-doctor`, `product-base-doctor`, `product-war-plan`, `product-replay-loading`, `product-replay-result`, `coach`, `coach-dashboard`, `admin`, `admin-growth`, `admin-health`, `referrals`, `guides`, `guide-rush-checker`, `guide-th14-upgrade`, `offline-shell`, `device-home-real`. Per-screen UX + premium redesign prompts in `docs/UI_IMAGE_PROMPTS.md`.

## 4. Bugs discovered → fixed → retested
Both are the **"configured-but-not-provisioned"** failure class: this env had `DATABASE_URL` set (so `isDatabaseConfigured()` returns true) but the DB had no Phase-7 tables, so best-effort telemetry hard-failed instead of degrading.

| # | Bug | Root cause | Fix | Retest |
|---|---|---|---|---|
| 1 | `POST /api/analytics/track` → **HTTP 500** (`Failed query: insert into analytics_events`) | `AnalyticsService.track` awaited the repo insert with no guard; a present-but-unmigrated DB threw uncaught | Made both sinks **best-effort** (try/catch swallow) — telemetry never fails the caller; taxonomy validation still 422s a genuinely bad event | ✅ now **200** `{ok:true}` |
| 2 | `POST /api/experiments/assign` → **422** (DB query failure) | `ExperimentService.assign` awaited `findBySubject`/`create`; a downed store propagated | Assignment now **degrades to stateless deterministic bucketing** when the store is down (it's hash-based + sticky anyway) | ✅ now **200** `{variant:"control"}` |

Tests added for both (a throwing repo must not break capture/assignment). Full gate after fixes: **format ✅ · lint `--max-warnings=0` ✅ · typecheck ✅ · 488 tests ✅ · coverage 95.68% / 88.74% ✅ · build ✅**.

Credential-gated endpoints degrade **correctly** (no fix needed): `products/checkout`, `report/checkout` → `503 not_activated`; `referrals` → `503` (auth not wired). Product submit returns a real AI-drafted report (`200`, ~5s).

## 5. UX findings (per-screen highlights)
- **Home** ✅ clear value prop, grade scale, 4 CTAs, disclaimer. *Improve:* visual flourish/hero; the grade chips could be more premium.
- **Onboarding** ✅ strong 3-step + goal chips. *Improve:* show progress; the goal default could be smarter.
- **Intake / Report form** ✅ honest "manual works now" copy; clean forms. *Wrong:* the `/report` Goal select defaults to a raw label ("rate") and both short pages leave large empty vertical space on mobile.
- **Pricing** ✅ full tier ladder + comparison + product add-ons + honest "checkout not activated" note. Best screen for conversion; matches the monetization doc.
- **Products** ✅ hub + form + **AI-drafted result works end-to-end on device** (score 66/100, confidence 90%, 5 recs). *Improve:* submit shows a plain "Analyzing…" for ~5s — needs a skeleton/progress + expectation-setting; the result's "preview only" note is good.
- **Coach / dashboards / referrals / admin-growth** ✅ render; correctly show "activates once DB/auth is live" panels. *Improve:* these gated panels are sparse (lots of empty space) — add illustrative empty states.
- **Admin-health** ✅ the activation matrix is genuinely useful (4/8 active here).
- **Guides (SEO)** ✅ index + detail with breadcrumb, content, mid-CTA, FAQ — exactly the programmatic-SEO play; editorially solid.
- **Cross-cutting:** mandatory Supercell disclaimer present on every screen ✅; consent banner present ✅; typography/spacing consistent but **utilitarian** — it reads as a clean MVP, not yet a "premium" brand (see image prompts for the elevation path).

## 6. Roadmap deviations
- **PWA, not native** — intended (ADR-0006), but worth restating: there is no app-store presence; install is via "Add to Home Screen".
- **No localization** — Chrome auto-translated the English UI to **Turkish** on the device. Given the roadmap's explicit TR/EU audience, real i18n (or at least a locale strategy) is a gap, not just a nicety.
- **Activation matrix** — the build matches the roadmap's phased scope; nothing is over-claimed. The free teaser/scoring/SEO/product-analysis-preview are live; paid/accounts/marketplace are gated as documented.

## 7. Launch blockers (unchanged by this validation; confirmed live)
1. **Reference-data verification** — `assertPaidReportAllowed` still blocks paid generation for every Town Hall (a data task, not a credential).
2. **No live Auth** — identity is the anonymous stub; ownership/RLS are unproven at runtime; referrals + dashboards return `not_activated`.
3. **Payments not activated** — no real purchase path on device (`503`).
4. **The "configured-but-not-provisioned" trap** — this session proved a present-but-invalid credential can break a subsystem; the 2 fixes harden the public telemetry endpoints, but **activation must include real provisioning + migration verification**, not just setting env vars. Recommend extending `isXConfigured()` checks (or startup self-checks) toward reachability, not just presence.

## 8. Performance findings
- **Page loads:** fast — static/SSG routes, ~102 kB shared First-Load JS, no heavy client bundles; instant on the device.
- **Product submit:** ~5.1 s (a real Anthropic call for AI enrichment) — functional but needs a better loading affordance.
- **Stability:** no jank, no layout thrash observed across 24 screens at the device viewport.

## 9. Log analysis
- **`adb logcat`** during a multi-route device session: **no FATAL, no ANR, no crashes, no chromium errors** (only normal `ActivityTaskManager`/`RecentsModel` lifecycle lines + an unrelated Play-Store crash-detector init).
- **Browser console** (Playwright, device viewport): **0 console errors / pageerrors across all 22 navigations**. (Web JS errors don't appear in logcat; captured via the browser instead.)

## 10. Overall quality score

| Dimension | Score /10 | Note |
|---|---:|---|
| Build & rendering on real device | 9 | clean build, every screen renders, no crashes |
| Stability / logs | 9 | zero crashes/ANR/console errors |
| Functional correctness (credential-free) | 8 | teaser, scoring, AI product analysis, SEO all work; 2 telemetry bugs found+fixed |
| Mobile UX / visual polish | 6.5 | clean + consistent but utilitarian; empty-state/loading/i18n gaps |
| Graceful degradation | 8 | gated paths 503 correctly; the 2 best-effort bugs now fixed |
| **Launch readiness (paid product)** | **3** | data-blocked paid path, no live auth/payments, activation unproven |
| **Composite (delivered quality)** | **≈ 7/10** | a strong, stable MVP web app; not yet a launchable paid business |

## 11. Would you confidently ship this app to real users today?

### `LIMITED_BETA_ONLY`

**Why.** What works on the real device works *well*: the free teaser, the deterministic CoachScore, the AI-drafted product analyses (ReplayDoctor/BaseDoctor/WarPlan), the SEO guides, and the PWA shell all render cleanly with no crashes — that is a credible **free, top-of-funnel beta** you could put in front of real Clash players today to validate demand and gather feedback.

But you **cannot** ship the paid business: paid report generation is **data-blocked** for every Town Hall (`assertPaidReportAllowed` throws), there is **no live authentication** (so accounts, ownership, RLS, referrals, and the coach marketplace are all dark/`not_activated`), and **payments are not wired**. This validation also proved a real production trap — a *present-but-unprovisioned* `DATABASE_URL` caused 500s on public telemetry endpoints (now fixed, but emblematic): activation must mean *provisioned + migrated + verified*, not just env-vars-set.

**Recommended path:** launch the free teaser + guides + product-analysis preview to a limited beta now; gate everything paid behind (1) reference-data verification, (2) live Supabase Auth + a green cross-tenant RLS run, (3) live Stripe with a real refunded test purchase, (4) i18n for the TR/EU audience. Until those four close, a full paid launch is premature.
