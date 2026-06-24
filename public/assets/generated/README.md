# Generated assets

Premium visual assets for the dark violet+gold "battle" theme. Two of these are
**OpenAI `gpt-image-1`** generations (the key is now present); the rest are
hand-authored SVG/CSS. Per the sprint rules we generate raster **only when it
adds real value**, keep files small (optimized webp), and prefer vector
elsewhere.

## OpenAI-generated (gpt-image-1 → optimized webp via ImageMagick)

### `hero-crest.webp` — 56 KB, transparent, 480×480
The brand crest: a premium violet shield with ornate gold filigree and an
ascending gold-chevron rank motif. The centerpiece of the marketing heroes.
- **Used in:** `components/ui/HeroBanner` (`crest` prop) → home, onboarding,
  pricing, products heroes. Rendered with `next/image` at 120×120 (fixed dims →
  no CLS), `priority`, soft gold glow + violet drop-shadow + gentle `float`
  micro-interaction (disabled under `prefers-reduced-motion`).
- **Prompt:** *"A premium heraldic emblem/crest for an elite game-coaching
  brand. A polished shield crest in deep violet (#a855f7) and luminous gold
  (#e8b339), subtle inner glow, fine metallic gold filigree edges, a stylized
  upward chevron / ascending-rank motif at the center suggesting progress and
  mastery, faint magical aura. Centered, symmetrical, crisp vector-like
  rendering with soft volumetric lighting. Transparent background. No text, no
  letters. Fantasy-strategy, top-tier mobile-game rank badge aesthetic."*

### `hero-aura-bg.webp` — 2.7 KB, opaque, 760×1140
A subtle dark battlefield-haze backdrop (near-black with a faint violet glow up
top and a warm gold ember haze below).
- **Used in:** `app/page.tsx` home hero — an absolutely-positioned `-z-10` layer
  at `opacity-60`, masked with `linear-gradient(to bottom, black, transparent)`
  so body text keeps AA contrast. Adds painterly depth behind the CSS aurora.
- **Prompt:** *"A dark, atmospheric vertical background texture for a premium
  dark-violet game UI. Near-black (#070510) base with a faint radial violet
  (#a855f7) glow in the upper third and a subtle warm gold (#e8b339) ember haze
  lower down, very low contrast, smooth gradients, no hard edges, no objects, no
  text. Mostly very dark so white text remains highly readable."*

## Hand-authored (no network)
- `shield.svg`, `divider.svg` — decorative SVG (crisp at any DPR, ~0.5 KB each).
- Brand wordmark: CSS gradient (`.wordmark` + `text-gold/violet-gradient`).
- App icon / PWA: `public/icon.svg`. Aurora backdrop: pure CSS (`globals.css`).

## Regeneration
Set `OPENAI_API_KEY` (standard name; the `.env.local` value is currently
`OPEN_AI_API_KEY` with a trailing space — see `ENV_AUDIT_REPORT.md`), then run
the generation script and re-optimize with ImageMagick:
`convert in.png -resize 480x480 -quality 86 -define webp:method=6 out.webp`.
