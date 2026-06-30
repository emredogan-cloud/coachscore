# CoachScore — Ultra Premium Visual Transformation Roadmap

> **Phase 0 deliverable.** Visual audit of `/interface/new` (the official source of truth) + the full 10-phase implementation plan. **No implementation begins until this roadmap is reviewed** (per the mission's "Begin with Phase 0 only" gate).

---

## 0. Visual audit — what `/interface/new` actually shows

I opened and studied the reference set. There are **30 images**; they reduce to **13 distinct templates** (the rest are per-Town-Hall guide variants and scrolled continuations that reuse a template):

| # | Reference image(s) | Template | Maps to (existing) |
|---|---|---|---|
| 1 | `01_onboarding` | Home hero (score ring, dual-CTA, feature grid) | `app/page.tsx`, `components/home` |
| 2 | `02_scrolled_onboarding` | Home: how-it-works rows + grade scale | `app/page.tsx` |
| 3 | `03_scrolled_onboarding` | Home: popular guides + trust block + FAQ + footer | `app/page.tsx` |
| 4 | `analyze_account` | **Full game-skin (OUTLIER)** — see §1 | `app/intake` |
| 5 | `manual_data_entry` | Premium dashboard form (segmented choices) | `app/intake`, `components/intake` |
| 6 | `01_war_readness`, `02_analyzed_warreadness` | War dashboard (ring, army rows, priority cards) | `app/war`, `components/war` |
| 7 | `coachscore_capilot` | Copilot panel + mascot + FAB | `components/copilot/copilot.tsx` |
| 8 | `pricing_page` | Pricing tier cards + comparison table | `app/pricing`, `components/pricing` |
| 9 | `sample_report_page` | Report: result card, 7-dim breakdown, roadmap, share | `app/report`, `app/sample-report`, `components/report` |
| 10 | `01_guides`, `02_guides` | Guides hub (search, filters, featured, grid) | `app/guides`, `components/seo` |
| 11 | `01-03_methodology_page` | Methodology / score-breakdown | `app/methodology`, `components/score-breakdown.tsx` |
| 12 | `guides_TH11–18`, `…hero-equipment-priority`, `…is-my-account-rushed` | Guide detail (tabs, phase roadmap, hero table) | `app/guides/[slug]`, `components/seo` |
| 13 | `01-02_examples_page`, `about_page`, `editorial_standards_page` | Content page (hero + cards + trust + CTA) | `app/examples`, `app/about`, `app/editorial-standards` |

### The reference design language (transferable, IP-safe)
Consistent across **12 of 13** templates:

- **Base:** near-black violet (`#070510`) with a fixed aurora backdrop + faint ember/spark particles. **This already exists** in `globals.css`.
- **Dual accent:** violet `#a855f7` + gold `#e8b339`. **Already exists.**
- **Score rings:** circular progress with a violet→gold gradient stroke + outer glow; big number + grade + label centered.
- **Section dividers:** gold uppercase tracked label flanked by ornamental diamond/gem motifs and thin gold rules (e.g. `◇— THE COACHSCORE GRADE SCALE —◇`).
- **Cards:** dark translucent surface, thin `white/8` border, soft inner glow, `rounded-2xl`; "featured" cards get a gold border + outer glow.
- **Grade color system:** S=gold, A=green, B=lime, C=yellow, D=orange, E=red.
- **Pills/eyebrows:** small rounded outline pills, gold or violet (`FREE · OBJECTIVE · INSTANT`, `MOST POPULAR`, honesty labels).
- **Buttons:** primary = gold-gradient (dark text) **or** violet-gradient (white text) with glow; secondary = violet/gold **outline**.
- **Chrome:** top nav (logo · Dashboard/Reports/Guides/Roadmap · gold **Premium** pill) + breadcrumbs; global footer (brand + Methodology/Editorial/Transparency/Privacy/Terms + © + Supercell disclaimer); a trust bar (4 icon+label items) recurring near page bottoms.
- **Iconography:** shield-based emblems (star-shield, crown-shield, lifering-shield), per-dimension mini-emblems, a helmeted "tactician" mascot.
- **Decorative art:** premium fantasy scenes (crystal-shield-on-altar, glowing strategy table, treasure chest, banners, scrolls) used as section accents.
- **Display type:** a chunky, confident display face for the brand + headlines (the reference uses a Supercell-style face — see §1 for the legal substitute).

---

## 1. ⚠️ Design direction & IP-safe interpretation (READ FIRST)

**The references are built on Clash of Clans intellectual property.** Every screen uses Supercell's character art (Barbarian, Archer Queen, P.E.K.K.A., Goblin, Dragons…), building art (Town Halls, defenses), and CoC-themed scenes. `analyze_account.png` goes furthest — it reproduces Clash's **game-UI trade dress** (stone-tablet panels, ornate gold frames, glossy game buttons) and the **trademarked Supercell Magic display font**.

**Two independent rules forbid shipping that literally:**
1. **The mission's own rule:** *"Do NOT generate fake Clash assets. Never generate fake Town Halls / troops / heroes / defenses."*
2. **The standing IP boundary** held across every prior CoachScore sprint: **do not bundle Supercell copyrighted art into the paid product, and never imply it is official.** For a **paid** product this is real copyright + trademark exposure.

**Therefore the build adopts the design _language_, not the _assets_:**

| Adopt (transferable, legal) | Replace / avoid (IP) |
|---|---|
| Layout, spacing, hierarchy, composition | Supercell character art → **original mascot + generic fantasy silhouettes** |
| Violet+gold palette, glow, elevation, aurora | Town Hall / troop / defense art → **abstract emblems + decorative crests** |
| Score rings, dividers, cards, pills, trust bars | Game-UI stone-tablet trade dress (`analyze_account`) → **premium-dark dashboard** (the other 12 templates) |
| Shield brand mark + helmeted tactician mascot | Supercell Magic font → **a licensed-for-web display face** (e.g. Lilita One / Baloo 2 / Fredoka via `next/font`) |
| Factual text ("Town Hall 16", "Barbarian King", army names) — nominative use, already live | "Official"/endorsement implications → keep the **"unofficial, not endorsed by Supercell"** disclaimer site-wide |

**What "95% fidelity" means here:** 95% to the **premium-dark dashboard language** (composition, glow, type, color, components) — the dominant reference style — rendered with **original, IP-safe decorative assets**. It explicitly does **not** mean reproducing Supercell's characters, buildings, or the `analyze_account` game-UI trade dress.

> This is the single most consequential interpretation in the sprint and is flagged for confirmation before implementation. If the intent was instead to ship the literal game-skin, that cannot be done safely for a paid product and we should discuss alternatives.

---

## Phase 1 — Branding (favicon / logo / OG / PWA)

**Goals.** Replace the generic gray-globe favicon with a premium, recognizable **shield mark** (gold + purple) that reads at 16×16 and matches the mascot/brand. Unify favicon, apple-touch-icon, OG image, and PWA icons.

**Files affected.** `app/icon.svg`, `app/apple-icon.png`, `public/icon.svg`, `public/manifest.webmanifest` (+ PWA icon set under `public/assets/`), `app/layout.tsx` (metadata `icons`, `openGraph.images`), `lib/seo` (OG/logo URLs), `scripts/generate-premium-assets.ts` (add favicon/OG concepts).

**Dependencies.** OpenAI key (`OPENAI_API_KEY`/`OPEN_AI_API_KEY`) for raster concepts; the §1 mascot/brand direction.

**Implementation strategy.** Generate **≥3 shield-mark concepts** via the asset pipeline (gold shield + violet field + a single recognizable glyph: star, crown, or the tactician helm). Hand-build the chosen mark as a **crisp SVG** for the favicon (raster gen is reference only — SVG stays sharp at 16px). Derive apple-touch (180²), maskable PWA icons (192/512), and a 1200×630 OG card. Keep `themeColor #070510`.

**Acceptance criteria.** Favicon legible at 16×16; consistent mark across browser tab, iOS home screen, PWA install, and OG preview; Lighthouse PWA "installable" passes; no gray globe anywhere.

**Testing checklist.** `pnpm build`; manifest icon test (`tests/pwa`); visual check of `/icon.svg`, `/apple-icon`, `/manifest.webmanifest`; OG debugger render; favicon at 16/32/180/192/512.

---

## Phase 2 — Global design system (unify to `/interface/new`)

**Goals.** Encode the §0 language as reusable tokens + primitives so every page shares it. Extend (don't replace) the existing theme.

**Files affected.** `app/globals.css` (tokens, dividers, glow, ember layer, grade colors), `tailwind.config.ts` (scale, font family, shadows), `app/layout.tsx` (display font via `next/font`), `components/ui/*` (extend `premium-card`, `score-ring`, `magic-button`, `status-badge`, `empty-state`; **add** `SectionDivider`, `EyebrowPill`, `TrustBar`, `GradeBadge`, `SiteNav`, `Breadcrumbs`, `SiteFooter`, `DimensionBar`).

**Dependencies.** Phase 1 (font + brand mark).

**Implementation strategy.** (a) Add the display font (`next/font`, subset, `display:swap`). (b) Promote tokens: gradient stops, glow shadows, grade-color map, divider ornaments. (c) Build the missing primitives as small, server-safe components (no client-only imports in shared leaves). (d) Provide a `/__styleguide` dev page to eyeball every primitive. (e) Reduced-motion-safe (extends existing `components/motion.tsx`).

**Acceptance criteria.** A single import surface (`components/ui`) renders nav, footer, dividers, pills, cards, rings, buttons, trust bars, grade badges at reference fidelity; CWV unaffected (CSS-first, no WebGL/framer-motion); `prefers-reduced-motion` honored.

**Testing checklist.** `pnpm lint/typecheck/test/build`; styleguide visual pass; existing component tests stay green; client-bundle check (no `node:` modules pulled into client islands).

---

## Phase 3 — Full screen transformation (95% fidelity)

**Goals.** Restyle every screen to the language from Phase 2: Home, Analyze (intake), Manual entry, Pricing, Report, Sample report, War, Methodology, Guides hub, Guide detail (×11 TH variants), Examples, About, Editorial standards, Transparency, FAQ, Referrals, Onboarding.

**Files affected.** `app/page.tsx`, `app/intake/*`, `app/pricing/*`, `app/report/*`, `app/sample-report/*`, `app/war/*`, `app/methodology/*`, `app/guides/*`, `app/examples/*`, `app/about/*`, `app/editorial-standards/*`, `app/transparency/*`, `app/referrals/*`, `app/onboarding/*`, and their `components/{home,intake,pricing,report,war,seo,share}` partials.

**Dependencies.** Phase 2 (primitives), Phase 4 (decorative assets — can proceed with placeholders, swap in when ready).

**Implementation strategy.** One screen per atomic commit, in money-path order: **Home → Report/Sample → Intake+Manual → Pricing → War → Guides hub+detail → Methodology → Examples/About/Editorial/Transparency → Onboarding/Referrals/FAQ**. Reuse existing data/engines verbatim (no logic changes); this is a presentation layer. Replace all CoC art slots with §1 decorative assets or abstract emblems. Keep every honesty label ("illustrative example", "not endorsed by Supercell").

**Acceptance criteria.** Each screen ≈95% to its reference template (layout/spacing/hierarchy/components); responsive 360→1440; dark-only; no fabricated data/numbers; all flows still functional.

**Testing checklist.** Per screen: `pnpm build` + route renders; existing route/component tests green; mobile + desktop viewport check; no clipped/invisible text (the recurring `dark:`-override bug — style with dark base classes).

---

## Phase 4 — Asset generation (decorative only)

**Goals.** Generate **only missing** decorative assets; never regenerate existing; **never** fake Clash assets.

**Files affected.** `scripts/generate-premium-assets.ts` (extend `ASSETS[]`), `public/assets/generated/*` (+ `manifest.json`), an `ASSET_INVENTORY` section in `FINAL_PREMIUM_VISUAL_REPORT.md`.

**Dependencies.** OpenAI key; §1 direction.

**Implementation strategy.** Enumerate needed assets: **tactician mascot** (+ small avatar + glowing-shield FAB), **brand shield** concepts (Phase 1), tier shields (star/crown/lifering), per-dimension emblems, crystal-shield-on-altar, glowing strategy table, treasure chest, scroll/book/banner, gem divider motif, section illustrations, loading + empty states. All **original fantasy** — no Town Halls/troops/heroes/defenses, no Supercell likenesses. Pipeline is cached/deterministic/skip-existing; export `webp`. If the key is absent, document the exact prompts + ship tasteful CSS/SVG placeholders (no fabrication).

**Acceptance criteria.** Every art slot filled by an original asset or a clean placeholder; `assets:generate` is idempotent; each asset documented (prompt, size, usage); total weight budgeted for CWV.

**Testing checklist.** Run `pnpm assets:generate` twice (second is a no-op); verify `webp` + manifest; Lighthouse weight check; visual audit that no asset resembles Supercell IP.

---

## Phase 5 — Copilot redesign (premium advisor + mascot + markdown)

**Goals.** Turn the Copilot into an elite strategy advisor: premium panel, **mascot** avatar replacing the plain purple circle, rich **markdown** rendering, and structured (non-paragraph) answers.

**Files affected.** `components/copilot/copilot.tsx` (panel, header, divider, bubbles, input, FAB), **new** `components/copilot/markdown.tsx` (safe renderer), `lib/copilot/knowledge.ts` (system prompt: enforce structured output — headings/lists/short sections), `app/api/copilot/route.ts` (unchanged tools/safety from Feature 4), assets from Phase 4 (mascot + FAB).

**Dependencies.** Phase 4 (mascot/FAB), Phase 2 (panel/divider primitives).

**Implementation strategy.** Rebuild the panel per `coachscore_capilot.png`: gold/violet bordered card, mascot header + gem divider, message grouping with avatars, **timestamps**, **typing indicator**, **copy button** per assistant message, **scroll anchor**. Add a small, dependency-light markdown renderer (headings, bold, lists, numbered, bullets, highlighted callouts, code, tables) with sanitization. FAB = glowing shield+chat emblem. Prompt updated to **always** answer in short structured blocks. Preserves Feature 4 tools/memory/safety/telemetry.

**Acceptance criteria.** Visual match to reference; markdown renders correctly + safely (no XSS); responses are structured, never giant paragraphs; copy/timestamps/typing indicator work; mobile-safe; reduced-motion honored. Deliver **`COPILOT_REDESIGN_REPORT.md`**.

**Testing checklist.** `lint/typecheck/test/build`; new markdown-renderer unit tests (sanitization + element coverage); existing copilot tests green; manual stream + tool-call render check; client-bundle stays clean (leaf imports only).

---

## Phase 6 — UX (global back button + friction audit)

**Goals.** Intuitive navigation everywhere; remove dead ends and unnecessary clicks.

**Files affected.** **New** `components/ui/back-button.tsx` + `components/ui/site-nav.tsx` (Phase 2), wired into page headers/breadcrumbs across `app/*`; audit notes in `FINAL_PREMIUM_VISUAL_REPORT.md`.

**Dependencies.** Phase 2 (nav/breadcrumbs), Phase 3 (screens restyled).

**Implementation strategy.** Add a consistent Back affordance (breadcrumb + explicit back on deep screens: report, guide detail, war, methodology). Audit each flow for dead ends (e.g. post-score next step, paywall exit, error states) and add a forward path. Keep nav active-state + breadcrumbs consistent.

**Acceptance criteria.** Every deep screen has Back + breadcrumb; no dead ends (every terminal state offers a next action); nav active state correct; keyboard/`aria` accessible.

**Testing checklist.** Manual flow walk (home→analyze→report→pricing→guide→back); `aria`/focus check; build green.

---

## Phase 7 — Pricing (Free / $2 / $4) + regional architecture

**Goals.** Experiment with **Free / Standard $2 / Pro $4**; document rationale; propose GeoIP currency localization (USD/TRY/EUR/GBP) with fallback.

**Files affected.** `lib/pricing/*` (tiers/prices behind flags), `app/pricing/*` + `components/pricing/*` (visual from `pricing_page.png`), `lib/payments` (LemonSqueezy variant mapping note), rationale + regional proposal in `FINAL_PREMIUM_VISUAL_REPORT.md` (no extra report file — deliverables capped at 5).

**Dependencies.** Phase 3 (pricing screen).

**Implementation strategy.** Add the $2/$4 experiment to `lib/pricing` (keep existing as fallback flag). **Regional architecture (proposal + scaffolding, not live charge):** GeoIP via edge header (`x-vercel-ip-country`) → currency map → display formatting (`Intl.NumberFormat`), with **USD fallback** when country/headers unknown. Document the LemonSqueezy variant-per-currency requirement (operator step) — actual multi-currency charge stays gated on variant provisioning (honest blocker).

**Acceptance criteria.** Pricing renders Free/$2/$4 at reference fidelity; currency display switches by country with USD fallback; rationale + regional plan documented; no fabricated "live" multi-currency checkout.

**Testing checklist.** `lib/pricing` unit tests (tiers + currency format + fallback); `pnpm build`; pricing route render; flag toggles tested.

---

## Phase 8 — Screen-recording investigation

**Goals.** Determine why screen recording is blocked; document; fix if accidental.

**Files affected.** Audit only → **`SCREEN_RECORDING_ANALYSIS.md`**; possible `next.config`/headers or `globals.css` fix if a CSS/PWA cause is found.

**Dependencies.** None (independent — can run in parallel).

**Implementation strategy.** Check candidates: CSP/`Permissions-Policy` headers, `display-mode` PWA settings, any `user-select`/secure-flag, Android `FLAG_SECURE` (native only — N/A for PWA), DRM/EME (none expected), and OS/Chrome capture policy. Reproduce, isolate, conclude.

**Acceptance criteria.** Root cause documented with evidence; if intentional, the reason; if accidental + in our control, fixed + verified.

**Testing checklist.** Repro on device; re-test after any fix; document result.

---

## Phase 9 — Device validation (Android)

**Goals.** Validate every screen on the physical Android device; capture real screenshots.

**Files affected.** `validation_screenshots/*` (real captures, not fabricated).

**Dependencies.** Phases 1–7 merged + deployed.

**Implementation strategy.** Per prior method (prod build via `adb reverse` + Chrome + Playwright, since USB drops). Walk every screen at device viewport; capture; check overflows, clipped/invisible text, layout shift, crashes/ANR. If the device is unreachable, say so explicitly and fall back to emulated device viewports — **never fabricate** screenshots.

**Acceptance criteria.** Every screen captured; zero overflow/clipping/invisible-text/layout-shift/crash, or each issue logged + fixed; 0 console errors.

**Testing checklist.** Screenshot set complete; console clean; issues triaged.

---

## Phase 10 — Final QA + report

**Goals.** Everything green + production-ready.

**Files affected.** Whole app; **`FINAL_PREMIUM_VISUAL_REPORT.md`**.

**Dependencies.** All phases.

**Implementation strategy.** Full gate (`lint --max-warnings=0`, `typecheck`, `test`, `build`, `secret-scan`); verify production build, PWA/mobile build, dark mode, responsive (360/768/1024/1440); fix every finding. Write the final report (per-phase outcomes, asset inventory, fidelity assessment, honest blockers, before/after).

**Acceptance criteria.** All gates green; deployed prod 200s; reference fidelity ≈95% on the premium-dark language; honest verdict.

**Testing checklist.** Gate green; CI green; live prod probe; report complete.

---

## Deliverables (exactly five, per the mission)
1. **ULTRA_PREMIUM_VISUAL_ROADMAP.md** (this file)
2. **BRANDING_REPORT.md** (Phase 1)
3. **COPILOT_REDESIGN_REPORT.md** (Phase 5)
4. **SCREEN_RECORDING_ANALYSIS.md** (Phase 8)
5. **FINAL_PREMIUM_VISUAL_REPORT.md** (Phase 10) — absorbs pricing rationale + regional proposal + asset inventory + device validation summary

## Execution discipline (per mission rules)
Atomic commits · commit after each phase · push frequently · keep CI green · no fake progress/screenshots/assets/tests · validate on device · final state production-ready. Phases 1→10 in order; Phase 8 may run in parallel.
