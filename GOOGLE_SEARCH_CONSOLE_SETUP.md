# GOOGLE SEARCH CONSOLE SETUP — CoachScore

**Date:** 2026-06-24 · **Sprint:** Final Production Hardening (Phase D)
**Stack:** Next.js 15 (App Router) on Vercel · domain `coachscore.app` · sitemap at `/sitemap.xml` · robots at `/robots.txt`.

> Screenshot placeholders use the path `screenshots/gsc/<name>.png` — capture these during the real setup.

---

## A. Domain setup (prerequisites)

### A1. Purchase the domain
- Register **`coachscore.app`** (the `.app` TLD is on the HSTS preload list → HTTPS is mandatory, which is fine: Vercel serves HTTPS by default). Use any registrar (Cloudflare Registrar recommended — at-cost pricing, easy DNS).
- The brand/domain contains no Supercell trademark (fan-content compliant — see `/transparency`).

### A2. DNS configuration (point the domain at Vercel)
In the registrar's DNS panel:
- **Apex (`coachscore.app`)** → Vercel: add an `A` record to `76.76.21.21` **or** use an `ALIAS`/`ANAME`/flattened-CNAME to `cname.vercel-dns.com` (Cloudflare supports CNAME flattening at apex).
- **`www`** → `CNAME` to `cname.vercel-dns.com`.
- Keep TTL low (300s) during setup. `screenshots/gsc/dns-records.png`

### A3. Deploy prerequisites (must be true before verification)
1. App deployed to Vercel and reachable at `https://coachscore.app`.
2. **`NEXT_PUBLIC_APP_URL=https://coachscore.app`** in Vercel env (this drives canonical/sitemap/OG — see `ENV_AUDIT_REPORT.md`).
3. `NEXT_PUBLIC_APP_ENV=production`.
4. Confirm live: `https://coachscore.app/sitemap.xml` lists ~25 URLs and `https://coachscore.app/robots.txt` declares the sitemap.
5. Confirm canonicals resolve to the apex (not localhost) — view-source any page, check `<link rel="canonical">`.

---

## B. Search Console

### B1. Add a property
- Go to **search.google.com/search-console** → **Add property**.
- Choose **Domain** property (covers all subdomains + http/https) — recommended over URL-prefix. `screenshots/gsc/add-property.png`

### B2. DNS TXT verification (Domain property)
1. GSC shows a `TXT` record like `google-site-verification=XXXXXXXX`.
2. Add it at the registrar: **Type** `TXT`, **Name/Host** `@` (apex), **Value** the full string. `screenshots/gsc/txt-record.png`
3. Wait for propagation (usually minutes; up to 48h). Click **Verify**.

### B3. Verification troubleshooting
- **"Record not found":** propagation delay — wait and retry; check with `dig TXT coachscore.app +short` (you should see the google-site-verification string).
- **Multiple TXT records:** that's fine — keep existing SPF/DMARC; just add the new one. Do not overwrite.
- **Cloudflare proxy:** TXT records are not proxied; ensure it's a plain DNS record.
- **Wrong host:** value must be on the apex `@`, not `www`.
- Fallback method (URL-prefix property): upload the HTML verification file or add the `<meta>` tag — but **Domain + DNS TXT is preferred**.

### B4. Submit the sitemap
- GSC → **Sitemaps** → enter `sitemap.xml` → **Submit**. (CoachScore's sitemap is dynamic, ISR-revalidated daily, with `lastmod`/priorities.) `screenshots/gsc/sitemap-submit.png`
- Status should become **Success** with ~25 discovered URLs.

### B5. URL inspection
- Paste any URL (e.g. `https://coachscore.app/guides/th14-upgrade-order-2026`) into the top search bar → **URL Inspection**.
- Check: **URL is on Google** (after indexing), **Coverage** = indexed, **Enhancements** show valid Article/FAQ/Breadcrumb. `screenshots/gsc/url-inspection.png`
- Use **Test live URL** to confirm Google can fetch + render it.

### B6. Request indexing
- For priority pages (home, `/methodology`, the top guides), use **URL Inspection → Request indexing** to prime the crawl. Do this sparingly (it's rate-limited; the sitemap handles the rest).

---

## C. Ongoing operations

### C1. Coverage / Pages report
- **Pages** report: monitor **Indexed** vs **Not indexed** and reasons (Crawled-not-indexed, Discovered-not-indexed, Duplicate-without-canonical, Excluded-by-noindex).
- Expected `noindex`/excluded: `/report`, `/admin`, `/coach/dashboard`, `/api/*` (intentionally blocked in `robots`).

### C2. Enhancement reports (rich results)
- **Enhancements** → confirm **FAQ**, **Breadcrumbs**, **Merchant/Product** (for `/products/*`), and **Article** items are *Valid*. Fix any "Invalid" before they affect rich results.
- Cross-check with the **Rich Results Test** (search.google.com/test/rich-results) on a guide + a product page.

### C3. Core Web Vitals
- **Core Web Vitals** report (field/CrUX data — appears once there's enough traffic): watch **LCP < 2.5s**, **INP < 200ms**, **CLS < 0.1**.
- CoachScore is static/SSG with a system-font stack and small bundles, so it should pass — but field data is the source of truth. Pair with **PageSpeed Insights** per-URL.

### C4. Performance report
- **Performance**: track **clicks, impressions, average position, CTR**. Split **branded** ("coachscore") vs **non-branded** queries. Watch the per-TH long-tail ("th14 upgrade order", "is my account rushed") emerge.

### C5. Fixing indexing issues
- **Discovered/Crawled – not indexed:** usually thin/low-value or new — CoachScore guards thin content (`validate:seo`); for new pages, request indexing + earn an internal link (already automated via the related-guide engine).
- **Duplicate, no canonical:** ensure `NEXT_PUBLIC_APP_URL` is the apex so canonicals are self-referential (the localhost bug is fixed).
- **Soft 404:** check the page renders real content server-side (guides are SSG).
- After a fix: **Validate fix** in the affected report.

---

## D. Recommended recurring schedule

| Cadence | Tasks |
|---|---|
| **Daily** (first 2–4 weeks post-launch) | Check **Coverage** for new errors; confirm new pages are getting indexed; watch for manual actions/security issues. |
| **Weekly** | **Performance** review (clicks/impressions/position trend, branded vs non-branded, top-rising queries); resubmit sitemap if many new guides shipped; spot-check **Enhancements** for new Invalid items. |
| **Monthly** | **Core Web Vitals** + **PageSpeed** audit; full index-coverage sweep; review which target queries are climbing/stalling; align content roadmap (new guides / EEAT) to the gaps; check backlinks via **Links** report. |

---

## E. Companion tools (set up alongside)
- **Bing Webmaster Tools** — import directly from GSC; submit the same sitemap.
- **PostHog / Plausible** — funnel + privacy-friendly traffic (env-gated; see `ENV_AUDIT_REPORT.md`).
- **Rich Results Test** + **Schema Markup Validator** — validate JSON-LD before/after schema changes.

---

## F. CoachScore-specific quick reference
- Sitemap: `https://coachscore.app/sitemap.xml` (dynamic, daily ISR, `lastmod` from the game-data patch date).
- Robots: `https://coachscore.app/robots.txt` (allows public; disallows `/api/`, `/admin`, `/coach/dashboard`, `/report`).
- Structured data live: Organization + WebSite(SearchAction) site-wide; Article+FAQ+Breadcrumb on guides; Product+Offer on `/products/*`; WebApplication on `/onboarding`.
- After any patch (reference-table version bump), guides re-date automatically → **resubmit sitemap** to nudge re-crawl of refreshed pages.
