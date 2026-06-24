# Generated assets

Phase C asset generation. **`OPENAI_API_KEY` is absent from `.env.local`**, so
OpenAI image generation was not run (no fabricated keys, no faked calls). Per the
sprint rule "never block implementation because of missing assets," visual assets
are produced **as code/SVG** instead — robust, crisp at any DPR, zero network,
and theme-aware:

- Brand wordmark: CSS gradient treatment (`.wordmark` + `text-gold-gradient` / `text-violet-gradient`).
- Icons / glyphs: inline SVG in components (home pillars, product cards, score ring, status dots).
- App icon + PWA: `public/icon.svg` (maskable).
- Decorative: `divider.svg`, `shield.svg` (here); the aurora backdrop is pure CSS (`globals.css`).

To add raster art later: set `OPENAI_API_KEY`, then generate from the prompts in
`docs/UI_IMAGE_PROMPTS.md` and drop optimized `.webp` here.
