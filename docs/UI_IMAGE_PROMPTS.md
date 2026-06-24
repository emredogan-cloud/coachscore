# UI Image Prompts — CoachScore (Phase 9 device validation)

Premium GPT-image prompts to recreate **and elevate** every screen to a world-class mobile SaaS standard. Screenshots were captured at the connected device's viewport (Xiaomi 22095RA98C, 393×876 CSS px, DPR 2.75) against the production build.

**Shared design direction (applies to every prompt below):** mobile-first (393×852), 8-pt spacing grid, generous whitespace, one confident accent (deep indigo→violet, e.g. `#4F46E5`) on an otherwise near-monochrome black/white system; Inter/Geist-style variable type with a strong size hierarchy (32–40px H1, 13px caption); soft 12–16px radii; subtle 1px hairline borders + low-elevation shadows; AA+ contrast; tasteful micro-interactions (press states, skeleton loaders, score count-up); confident, trustworthy, "expert coach" mood — not gamer-loud. Always preserve the mandatory footer disclaimer.

---

## Home / Landing
**Screenshot:** `screenshots/home.png`
**Components:** wordmark "CoachScore"; value-prop paragraph; "The CoachScore grade scale" S–F band grid (6 chips); primary CTA "Score your account" + secondary "See pricing", "Specialized tools", "Upgrade guides"; sub-CTA reassurance line; Supercell disclaimer footer.
**GPT image prompt:** *Design a premium mobile landing screen for "CoachScore", a Clash-of-Clans account-rating SaaS. Style: refined fintech-grade minimalism, near-monochrome with a single indigo→violet accent. Layout: large bold wordmark, a confident one-sentence value prop, then a visually elevated S→F grade-scale as a 2-column grid of rounded chips with the top grade (S) subtly highlighted in the accent. A full-width primary button "Score your account" with a soft gradient + crisp secondary outline buttons. Typography: tight large display heading, comfortable body. Spacing: airy 8-pt grid. Add a faint hero glow behind the wordmark, subtle depth on the grade chips, and a trust line. Mood: authoritative, calm, expert. Include the small legal disclaimer at the bottom. World-class mobile SaaS.*

## Onboarding
**Screenshot:** `screenshots/onboarding.png`
**Components:** "Welcome to CoachScore"; numbered 3-step explainer cards (Submit → Get scored → Get roadmap); "Pick a goal" chip group (Rate / Win wars / Push trophies / De-rush / Get recruited / Steady progress); CTA "Start — score my account" + "See pricing".
**GPT image prompt:** *Design a world-class mobile onboarding screen. Three vertically stacked numbered step cards with large numerals, bold titles, and muted subtitles, each in a soft hairline card with gentle elevation. Below, a horizontally-wrapping set of selectable "goal" pills with clear selected/unselected states (accent fill when selected). A prominent primary CTA pinned visually at the bottom. Use an indigo accent, generous whitespace, an 8-pt rhythm, and subtle connecting line/progress motif between the steps. Mood: welcoming, confidence-building, premium SaaS.*

## Intake (method picker)
**Screenshot:** `screenshots/intake.png`
**Components:** "Score your account" heading; honest availability subtext; 3 method cards (Manual entry · Screenshots · Player tag) with title + one-line description.
**GPT image prompt:** *Design a premium "choose your input method" mobile screen with three large tappable method cards, each with a leading line-icon (keyboard, image, hashtag), a bold title, a short description, and a trailing chevron. Show clear affordance: the always-available option looks fully enabled; the credential-gated options carry a subtle "activates soon" pill rather than looking broken. Indigo accent, soft shadows, rounded cards, lots of breathing room, no dead space (balance the layout vertically). Mood: effortless, trustworthy.*

## Report intake (CoachScore form)
**Screenshot:** `screenshots/report.png`
**Components:** "Your CoachScore" heading; Goal select + Town Hall; "Hero levels" 2-col inputs (Barbarian King, Archer Queen, Grand Warden, Royal Champion, Minion Prince, Dragon Duke); Offense/Defense/Progression %, Walls, Clan activity; "Get my CoachScore" CTA.
**GPT image prompt:** *Design a polished mobile data-entry form for rating a game account. Group fields into labelled sections ("Hero levels", "Offense & defense", "Progression") inside hairline cards; use a tidy 2-column grid for paired inputs with floating labels, numeric steppers, and a segmented control for the Goal selector. Sticky primary "Get my CoachScore" button. Indigo accent on focus rings, gentle inline validation, 8-pt spacing, refined typography. Mood: precise, fast, professional — like a premium fintech form.*

## Pricing
**Screenshot:** `screenshots/pricing.png`
**Components:** "Pricing" heading + not-activated note; tier cards (Free Teaser, Basic $7, Standard $12 "Most popular", Pro $29, AccountRescue $19, Clan/Bulk $8/seat) each with features + CTA; comparison matrix; "Specialized coaching tools" section (ReplayDoctor $9 / BaseDoctor $9 / WarPlan $7).
**GPT image prompt:** *Design a world-class mobile pricing page. A vertical stack of tier cards with the "Standard / Most popular" card visually elevated (accent border, badge, slight scale). Each card: tier name, large price, one-line blurb, a check-list of features with accent checkmarks, and a full-width CTA. Below, a clean horizontally-scrollable comparison table with sticky first column and check/dash glyphs, then a distinct "Specialized tools" card row. Strong price typography, clear hierarchy between primary and secondary tiers, indigo accent, soft shadows. Mood: confident, conversion-optimized, trustworthy SaaS pricing.*

## Products hub
**Screenshot:** `screenshots/products-hub.png`
**Components:** "Specialized coaching tools" heading + intro; 3 product cards (ReplayDoctor / BaseDoctor / WarPlan) with price, blurb, feature bullets, "Start" CTA.
**GPT image prompt:** *Design a premium mobile "specialized tools" catalog: three rich product cards, each with a distinct line-icon (replay/triangle-play, base/grid, war/crossed-swords), a bold name, a price chip, a short value line, 3–4 feature bullets, and a full-width accent CTA. Add subtle per-card accent tints to differentiate the three SKUs while staying cohesive. Generous spacing, rounded cards, soft elevation, clear scan-ability. Mood: modular, capable, premium.*

## Product submission form (ReplayDoctor / BaseDoctor / WarPlan)
**Screenshot:** `screenshots/product-replay-doctor.png` (pattern shared by `product-base-doctor.png`, `product-war-plan.png`)
**Components:** product title + "$ / coach-verified" subtitle; typed fields (Town Hall, Attack context select, Stars, Destruction %, durations, free-text "Anything else?"); "Get my analysis" CTA.
**GPT image prompt:** *Design a refined mobile analysis-request form for a Clash-of-Clans replay review. Clear field labels, native-feeling selects with custom chevrons, numeric inputs with units, a roomy optional textarea, and a confident full-width "Get my analysis" button. Section the inputs logically, add focus/active states in indigo, inline helper text, and a small "coach-verified · $9" trust chip near the title. 8-pt grid, soft radii. Mood: expert, frictionless, premium.*

## Product result (AI-drafted report)
**Screenshots:** `screenshots/product-replay-loading.png` (loading) · `screenshots/product-replay-result.png` (result)
**Components:** "preview only" persistence note; report header (title, "AI-drafted · Attack score 66/100"); big score; SUMMARY; MISTAKES / TIMING / ATTACK DIAGNOSIS / RECOMMENDATIONS sections; confidence + version footer; "Submit another".
**GPT image prompt:** *Design a premium mobile AI-report result screen. Hero: a large animated-feel circular/numeric score (e.g. 66/100) with a subtle ring gauge in the accent, plus an "AI-drafted, pending coach verification" trust badge. Below, well-typeset sections (Summary, Mistakes, Timing, Diagnosis, Recommendations) using clear section labels, comfortable line length, and numbered recommendation steps with accent markers. A discreet "preview only" info banner and a version/confidence footer. Loading variant: an elegant skeleton + "Analyzing…" with a calm shimmer (no jarring spinner). Mood: insightful, credible, delightful.*

## Coach application
**Screenshot:** `screenshots/coach.png`
**Components:** "Become a CoachScore coach" + 60%-revenue line; Display name, Bio, Specialties checkbox group, Why/Experience textareas; "Apply to coach"; "Go to your coach dashboard →".
**GPT image prompt:** *Design a premium "become a coach" application form for a marketplace. Confident headline + a benefit line emphasizing the 60% revenue share in the accent. Specialties shown as toggleable chips (not raw checkboxes). Clean textareas with character affordance, a strong primary submit, and a subtle secondary link to the dashboard. Trust cues (vetting, payout). 8-pt spacing, refined type. Mood: aspirational, professional, marketplace-grade.*

## Coach dashboard / Admin / Admin growth (operational, currently gated)
**Screenshots:** `screenshots/coach-dashboard.png`, `screenshots/admin.png`, `screenshots/admin-growth.png`
**Components:** headings + "activates once the database/auth is live" panels (review queue / moderation / funnel + experiment + referral metrics when active).
**GPT image prompt:** *Design world-class mobile operational dashboards (coach review queue; admin moderation; growth analytics). Use compact KPI stat cards with large numerals + trend deltas, a funnel visualization as a stacked horizontal bar with conversion %s, an experiment-variant split bar, and a referral/K-factor card. Clean data tables become stacked cards on mobile. When data is unavailable, show a tasteful empty/onboarding state rather than an error. Indigo accent for positive metrics, restrained palette, dense-but-legible. Mood: control-room clarity, premium analytics SaaS.*

## Admin health
**Screenshot:** `screenshots/admin-health.png`
**Components:** "System health" + activation summary ("4 of 8 activated"); per-subsystem rows with active/not-activated status; observability rows.
**GPT image prompt:** *Design a premium "system health / activation matrix" mobile screen: a header with an overall readiness ring ("4 of 8"), then a list of subsystems each with a status pill (green "active" / muted "not activated") and a leading status dot. Group core services vs observability with a divider. Add subtle row hover/press and a last-checked timestamp. Mood: ops dashboard, calm, trustworthy, status-page quality.*

## Referrals
**Screenshot:** `screenshots/referrals.png`
**Components:** "Refer friends" + creator-code explainer; (when active) code display, share targets, stats; currently the "built and ready" gated panel.
**GPT image prompt:** *Design a premium referral screen: a bold headline, a one-line creator-code value prop, a large copyable referral-code chip with a copy button, a row of share-target buttons (X, WhatsApp, Reddit, Telegram, copy) as icon pills, and an "your impact" stat card (referrals · converted · earned). Include a friendly empty/gated state. Indigo accent, share-forward layout, social proof. Mood: viral, rewarding, shareable.*

## Guides index + guide detail (programmatic SEO)
**Screenshots:** `screenshots/guides.png`, `screenshots/guide-rush-checker.png`, `screenshots/guide-th14-upgrade.png`
**Components:** index list of guide links; detail = breadcrumb, H1, intro, sections, mid-page CTA card ("Get your free CoachScore"), FAQ.
**GPT image prompt:** *Design a premium SEO article + index for a game-strategy site. Index: a scannable list of guide cards with title + one-line description. Detail: clean editorial typography (clear H1/H2, comfortable measure), a breadcrumb, well-spaced sections, an inline accent CTA card mid-article ("Score my account free"), and an accordion FAQ. Add a reading-progress feel and strong content hierarchy. Mood: authoritative evergreen content that converts to the product — editorial polish meets SaaS CTA.*

## Offline shell (PWA)
**Screenshot:** `screenshots/offline-shell.png`
**Components:** centered "You're offline" message + explanation.
**GPT image prompt:** *Design a tasteful PWA offline screen: centered, a friendly line-illustration (disconnected plug / sleeping mascot), "You're offline" headline, a calm reassurance paragraph, and a subtle "Retry" affordance. Dark, minimal, on-brand with the indigo accent. Mood: calm, branded, non-alarming.*

## Real-device evidence
**Screenshot:** `screenshots/device-home-real.png` — actual `adb screencap` from the Xiaomi (Chrome), proving the production build runs on the physical device. Note: Chrome auto-translated the English UI to Turkish (a real finding → consider locale-aware i18n for the TR/EU audience).
