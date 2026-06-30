# Supercell API Activation Report

> PMF-correction sprint · Phase 3. What was built to turn "paste your tag → instant objective score" into a production-ready integration, and exactly what an operator must provision to switch it on. **No fabrication:** the integration is complete and unit-tested; it has **not** been run against the live API from this environment (no token/proxy here), so live activation is an operator step, documented below.

## TL;DR

The official Clash of Clans API is now a **first-class, production-grade intake path** behind the existing `CocApiAdapter` interface. It ships **dark** (off) and the app degrades cleanly to manual entry until two secrets are set. Activation is **not a code change** — set `COC_API_TOKEN` + `COC_API_PROXY_URL`, redeploy, done.

## What was built

| Piece | File | What it does |
|---|---|---|
| Response schema | `lib/intake/coc-api-schema.ts` | Zod validation of the `GET /v1/players/{tag}` subset we use; tolerates optionals + unknown/new fields (`passthrough`). |
| Field mapper | `lib/intake/coc-mapper.ts` | Maps the API player → engine `IntakeFields`: objective heroes, offense (army/lab), equipment, progression, clan signals; marks defense + walls **unknown**. |
| Production client | `lib/intake/coc-api-client.ts` | `ProxyCocAdapter` — real HTTP client with **caching, retries+backoff, rate limiting, validation, graceful typed errors**; `createCocAdapter()` factory + `TokenBucket`. |
| Wiring | `lib/intake/tag.ts`, `lib/api/report-handler.ts`, `app/report/actions.ts` | `intakeByTag` uses the real adapter when configured; `handleReportByTag` is the primary report path with manual fallback. |
| UI | `components/report/report-flow.tsx`, `app/report/page.tsx` | Player-tag input + "Analyze My Account" is the primary flow; manual entry is the advanced fallback. |
| Tests | `tests/intake/coc-api.test.ts` | Mapper + adapter (200/404/403/429/503, cache, tag-encoding, invalid-tag, **retry-after honored + capped, cache eviction, singleton memo**) + tag-path scoring. **19 tests.** |

### Production qualities (built, per the brief's requirements)
- **Caching** — per-tag in-memory cache, default **120 s** TTL; serves **stale-on-error** if the upstream fails after retries. **Bounded** (default 500 entries, oldest evicted) so a long-lived warm instance can't grow memory without limit.
- **Process singleton** — `createCocAdapter()` memoizes one adapter per process (keyed on the credentials), so the cache and the rate-limiter token bucket actually persist across warm serverless invocations instead of being rebuilt — and discarded — on every request.
- **Retries** — exponential backoff (250 ms·2ⁿ, capped 4 s) with jitter on 429/5xx/network; a server-supplied **`retry-after`** header (delta-seconds **or** HTTP-date) now takes precedence over our backoff, bounded by `maxRetryAfterMs` (default 30 s) so a hostile/absurd value can't stall a request. **404 and 403 are not retried** (terminal).
- **Rate limiting** — `TokenBucket` (~8 req/s, burst 8) to stay under the API's ~10 req/token/s throttle.
- **Validation** — Zod at the network boundary; a partial/changed payload never reaches the engine.
- **Graceful errors** — typed: `CocPlayerNotFoundError` (404 → "tag not found" UX), `CocApiAccessError` (403 → ops alert, token/IP misconfig), `CocApiUnavailableError` (429/5xx/maintenance → retry then friendly fallback), `CocApiNotConfiguredError` (no creds → manual fallback). 8 s request timeout via `AbortController`.

### Feature 5 hardening (PMF Critical Features sprint)
A focused audit of the correction-sprint adapter surfaced three production gaps, now closed: (1) `createCocAdapter()` was instantiated **per request**, so the cache + token bucket were effectively dead across warm invocations → now a **process singleton**; (2) the header comment claimed it honored `retry-after` but `backoffMs` was pure exponential → now it **genuinely honors `retry-after`** (capped); (3) the cache `Map` **never evicted** → now **size-bounded**. No dead code was found to remove (`TokenBucket`/`ProxyCocAdapterOptions` are intentional, exported module API). UX is unchanged: still NotConfigured → manual-entry fallback until activated.

## The infrastructure required to go live (the one real blocker)

The official API issues **IP-whitelisted** tokens (`developer.clashofclans.com`). Vercel serverless functions egress from **rotating IPs**, so a raw token gets `403 accessDenied.invalidIp`. The standard fix:

1. **Create an API token** at https://developer.clashofclans.com/ (a real account that accepts the API terms).
2. **Whitelist the RoyaleAPI proxy egress IP `45.79.218.79`** on that token (not your own server IP).
3. **Point the client at the CoC proxy host**: set `COC_API_PROXY_URL=https://cocproxy.royaleapi.dev`.
   - ⚠️ It must be the **CoC** host `cocproxy.royaleapi.dev` — `proxy.royaleapi.dev` is Clash Royale and will fail.
   - The client tolerates a trailing `/v1` or `/`; it requests `${base}/v1/players/%23TAG`.
4. **Set the secrets in Vercel** (production, server-only — never exposed to the client):
   - `COC_API_TOKEN=<jwt from step 1>`
   - `COC_API_PROXY_URL=https://cocproxy.royaleapi.dev`
5. Redeploy. `isCocApiConfigured()` flips true and the tag path activates automatically; no code change.

**Fallback option:** run your own thin proxy on a host with a static IP (e.g. a small GCE/Fly VM), whitelist that IP, and point `COC_API_PROXY_URL` at it. The base URL is env-driven so you can switch hosts without a redeploy of code.

## Important data nuance (drove the design)

The API returns `level` and `maxLevel` per troop/hero/spell, but **`maxLevel` is the ABSOLUTE in-game max across all Town Halls, not the per-Town-Hall cap** (verified via the `clashofclans.js` typings, which expose a separate computed `hallMaxLevel`). Consequences, all handled:
- **Heroes** are scored against the **Game-Data Reference Table's per-TH caps** (exact for TH16/17 — see `REFERENCE_DATA_VERIFICATION_REPORT.md`), not the API's absolute max.
- **Offense/equipment** use the API ratio as honest "development toward max" — strongest near the endgame Town Halls we target (TH16–18); equipment caps are reached at the TH16 Blacksmith so its absolute max *is* the cap at TH16+.
- **Defense + walls are not exposed by the API at all** (no building/wall/layout data). They are marked `unknownDimensions` → the engine drops + renormalizes them, and the UI invites a screenshot to complete them. The tag score is honest about what it can and cannot see (~72–77% of the goal weight is objectively read).

## Compliance (paid product)

Supercell's Fan Content Policy permits paid **coaching** ("training and guidance… online coaching or similar"), the strongest basis for a paid CoC tool. Guardrails already honored: framed as coaching/analysis, the API token holder accepts the API terms, no Supercell art bundled, the "unofficial / not endorsed by Supercell" disclaimer ships site-wide. Re-confirm the gated API terms before a full commercial launch.

## Status

`BUILT + UNIT-TESTED · DARK (off) · ONE OPERATOR STEP FROM LIVE`. Until activated, the tag field still appears (it's the primary UX) and returns a clean "enter manually" fallback — no error, no dead end.
