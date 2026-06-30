# CoachScore — Branding Report (Phase 1)

> Replaces the generic gray-globe favicon with a premium, recognizable **shield** brand mark (gold + violet), and unifies favicon · apple-touch-icon · OG card · PWA icons. All assets are **original / IP-safe** (no Supercell likeness), per the confirmed Phase-0 direction.

## Problem
Google/browser tabs showed a generic placeholder: `public/icon.svg` was a black rounded square with white "CS" text — no brand identity, easily lost among results.

## Concepts explored (OpenAI `gpt-image-1`, via `pnpm assets:generate`)
The mission asked for ≥3 favicon/logo concepts. Three **shield** marks were generated (gold border + violet field + a single recognizable glyph), plus the brand mascot and the Copilot launcher emblem:

| Asset | File | Outcome |
|---|---|---|
| Concept A — **star/spark** | `brand-shield-star.webp` | Strong, universal; alternate |
| Concept B — **crown** | `brand-shield-crown.webp` | Premium, but crown detail muddies at 16px; reserved as a premium-tier accent |
| Concept C — **double chevron** ✅ | `brand-shield-chevron.webp` | **Selected** — bold, legible at 16px, and on-message: chevrons = *rank / ascent* ("climb the ranks, improve your account"), and they echo the rank-insignia feel in the reference nav |
| Mascot — **tactician** | `mascot-tactician.webp` | Original armored strategist (violet+gold, glowing violet eyes, helm in a gold shield). Used by the Copilot (Phase 5) + as the brand character |
| Copilot FAB | `copilot-fab.webp` | Gold shield + glowing chat-bubble launcher emblem |

**Selection: the double-chevron shield.** Star + crown are documented alternates.

## Production assets shipped
The favicon is **hand-built as a crisp SVG** (the OpenAI raster is concept reference only — vector stays sharp at 16px and scales infinitely). Raster derivatives that genuinely require PNG (iOS/Android/OG don't render SVG) are composited from the selected raster shield.

| Asset | File | Notes |
|---|---|---|
| Favicon | `public/icon.svg` | Crisp vector chevron shield (gold gradient border, violet field, gold chevrons). Feeds the tab favicon, `manifest` `any` icon, and the Organization-JSON-LD logo (`orgLogoUrl`). |
| Apple touch icon | `public/apple-icon.png` (180²) | Dark full-bleed + shield (iOS rounds corners). |
| Maskable PWA icons | `public/icon-192-maskable.png`, `public/icon-512-maskable.png` | Shield within the inner ~66% safe zone on a dark canvas — correct Android adaptive-icon behavior (the old SVG `maskable` was poorly supported). |
| OG / social card | `public/og-image.png` (1200×630) | Branded card: chevron shield + "CoachScore" wordmark + tagline. The site-wide default for pages without a score-specific card. |

## Wiring
- `app/layout.tsx` → `metadata.icons` (SVG icon + maskable PNG + apple-touch).
- `app/manifest.ts` → PNG maskable icons (192/512) replacing the SVG-maskable entries.
- `lib/seo/metadata.ts` → `buildMetadata` now defaults OG to the branded `/og-image.png`; pages that want a **score-specific** card still pass `ogImagePath → /api/share/og?grade=…`.
- `app/api/share/og/route.tsx` → the dynamic per-score share card rebuilt **on-brand**: near-black violet base + radial glow, inline gold shield mark + "CoachScore" wordmark, and the **grade colored by its band** (S gold · A green · B lime · C yellow · D orange · E red) — matching the on-site grade scale.

## IP-safety
Every mark is original heraldry/fantasy — a generic shield + chevrons and an original armored mascot. No Supercell characters, buildings, logos, or the Supercell Magic font. The "unofficial / not endorsed by Supercell" line remains on the share card.

## Verification
- `pnpm lint --max-warnings=0` · `pnpm typecheck` · `pnpm build` (30 pages, `/api/share/og` compiles for edge) — all clean.
- `tests/pwa` + `tests/seo` — 24 green (manifest icons validated).
- `public/icon.svg` — well-formed XML; standard SVG gradients/paths render natively in browsers (final on-device visual confirmation in Phase 9).
- `pnpm assets:generate` is idempotent — re-runs skip all cached assets.

## Honest notes
- Local SVG→PNG rasterization (`rsvg-convert`) is **not installed** in this environment, so PNG derivatives were composited from the OpenAI raster shield rather than from `icon.svg` directly. The vector favicon itself renders in-browser; it is visually re-confirmed during Phase 9 device validation.
- The OG card text is rendered with DejaVu Sans Bold (system font) for the static card; the in-app display font lands in Phase 2.
