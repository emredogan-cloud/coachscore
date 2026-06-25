# PRODUCTION SEARCH CONSOLE CHECKLIST — coachscore.app

**Use after** `coachscore.app` is live on Vercel and DNS resolves (`NAMECHEAP_DNS_SETUP.md`).
Companion: `GOOGLE_SEARCH_CONSOLE_SETUP.md` (the detailed how-to). This file is the **tick-box runbook**.

---

## 1. Property creation
- [ ] Go to **search.google.com/search-console**.
- [ ] **Add property → Domain** (not URL-prefix). Enter `coachscore.app`.
- [ ] Google shows a `TXT` verification string `google-site-verification=…`.

## 2. DNS TXT verification
- [ ] Add the `TXT` record at Namecheap: Type `TXT`, Host `@`, Value the full `google-site-verification=…` string, TTL Automatic (see `NAMECHEAP_DNS_SETUP.md` Step 4).
- [ ] Wait for propagation; confirm with `dig TXT coachscore.app +short`.
- [ ] Click **Verify** in GSC. (Keep the record forever — removing it un-verifies the property.)

## 3. Sitemap submission
- [ ] Confirm live: `https://coachscore.app/sitemap.xml` returns ~25 URLs; `https://coachscore.app/robots.txt` declares the sitemap.
- [ ] GSC → **Sitemaps** → enter `sitemap.xml` → **Submit**.
- [ ] Status becomes **Success**; "Discovered URLs" ≈ 25.
- [ ] Also add the property + sitemap in **Bing Webmaster Tools** (import from GSC).

## 4. URL inspection
- [ ] Inspect `https://coachscore.app/` → **Test live URL** → confirm fetch + render OK.
- [ ] Inspect a guide (`/guides/th14-upgrade-order-2026`) → confirm **Article / FAQ / Breadcrumb** enhancements detected.
- [ ] Inspect a product (`/products/replay_doctor`) → confirm **Product/Offer** detected.

## 5. Indexing requests
- [ ] Request indexing for the priority pages (sparingly — it's rate-limited):
  - [ ] `/` (home)
  - [ ] `/methodology`
  - [ ] `/guides/is-my-account-rushed`
  - [ ] top 2–3 upgrade-order guides
- [ ] Let the sitemap handle the long tail (don't bulk-request).

## 6. Core Web Vitals
- [ ] **Core Web Vitals** report (field data appears after enough traffic): watch **LCP < 2.5s**, **INP < 200ms**, **CLS < 0.1**.
- [ ] Spot-check with **PageSpeed Insights** on `/` and a guide (lab data is available immediately).
- [ ] CoachScore is static/SSG + system fonts + small bundles → expect green; field data is the source of truth.

## 7. Enhancement reports
- [ ] **Enhancements → FAQ / Breadcrumbs / Merchant listings / Article**: confirm **Valid**, fix any **Invalid**.
- [ ] Cross-check with the **Rich Results Test** (search.google.com/test/rich-results) on a guide + a product page.
- [ ] Confirm the intended exclusions in **Pages**: `/report`, `/admin`, `/coach/dashboard`, `/api/*` are *not* indexed (blocked in robots — correct).

## 8. Recurring monitoring schedule
- [ ] **Daily** (first 2–4 weeks): Coverage/Pages for new errors; confirm new pages indexing; watch for manual actions / security issues.
- [ ] **Weekly**: Performance review (clicks/impressions/position; branded vs non-branded; rising queries); resubmit sitemap after large guide batches; check Enhancements for new Invalid items.
- [ ] **Monthly**: Core Web Vitals + PageSpeed audit; full index-coverage sweep; Links/backlinks review; align the content roadmap to query gaps.

---

## Quick reference
- Sitemap: `https://coachscore.app/sitemap.xml` (dynamic, daily ISR, `lastmod` from the game-data patch date — **resubmit after a reference-table patch** to nudge re-crawl of refreshed guides).
- Robots: `https://coachscore.app/robots.txt`.
- Structured data live: Organization + WebSite(SearchAction) site-wide; Article+FAQ+Breadcrumb on guides; Product+Offer on `/products/*`; WebApplication on `/onboarding`.
- Verification TXT and the sitemap must **stay** in place permanently.
