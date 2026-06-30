# CoachScore — Copilot Redesign Report (Phase 5)

> Turns the Copilot from a plain streaming text box into a premium, mascot-led strategy advisor with rich, structured (markdown) answers — matching `coachscore_capilot.png`. Behavioral engine (tools/memory/safety/telemetry from Feature 4) is unchanged; this is the presentation + output-format layer.

## What changed

### Premium panel (`components/copilot/copilot.tsx`)
- **Launcher (FAB):** the plain violet circle → the original **glowing shield+chat emblem** (`copilot-fab.webp`) with a violet glow, replacing the generic icon.
- **Panel:** dark `ink-950/95` glass with a **gold-tinted border + violet glow**, a header lockup (the **tactician mascot** `mascot-tactician.webp` + "CoachScore **Copilot**" + "Strategy advisor · grounded in your data"), and a **gold gem divider** under the header.
- **Opening animation:** the panel plays a `panel-in` entrance (CSS-only, no JS motion lib) — it **grows up from the FAB corner** (`origin-bottom-right`, opacity 0→1 + `translateY(12px) scale(0.96)`→rest) on the shared `settle` easing `cubic-bezier(0.16,1,0.3,1)`. Disabled by the global `prefers-reduced-motion` rule.
- **Messages:** assistant turns get a small **mascot avatar**, a bordered bubble, a **timestamp**, and a hover **Copy** button; user turns are violet-gradient bubbles with a timestamp. A **typing indicator** (three pulsing dots) shows while the first token is pending.
- **Input:** rounded dark field + a violet **send icon** button (paper-plane).
- Preserved verbatim: streaming reader, localStorage **memory** + **Clear/forget**, the "first turn must be user" guard, and graceful 503/429 handling.

### Rich markdown rendering (`components/copilot/markdown.tsx`, NEW)
A tiny, **dependency-free, XSS-safe** renderer (builds React elements — never `dangerouslySetInnerHTML`, so model text can't inject HTML/scripts; React escapes everything). Supports the structured subset the Copilot is prompted to use:
- `#/##/###` headings, **bold**, *italic*, `inline code`, fenced ``` code blocks ```
- ordered + unordered lists, `>` blockquote callouts, and **tables**
- links restricted to `http(s)`/relative schemes (`javascript:` etc. are neutralized to `#`)

### Structured-output prompt (`lib/copilot/knowledge.ts`)
The system prompt now **enforces scannable markdown** — a one-line lead, then bold key terms, short bullet/numbered lists, subheadings for multi-part answers, and tables for comparisons. **Never one long paragraph.** (The anti-hallucination ground-truth rules are unchanged.)

## Mascot (IP-safe)
The mascot is an **original** armored "tactician" (helmet, glowing violet eyes, gold/violet armor in a shield silhouette) generated in Phase 1 — not a Clash of Clans character. No Supercell art or font is used.

## Verification
- **`tests/copilot/markdown.test.tsx`** — 9 new tests: bold/italic/code, headings, lists, blockquote, code-block (no markdown bleed), tables, **safe vs unsafe links**, **XSS-safety** (`<script>` is escaped, not executed), paragraph splitting.
- Copilot test area: **96 green** (markdown + the Feature-4 tools/memory/safety/telemetry suites).
- `pnpm lint --max-warnings=0` · `pnpm typecheck` · `pnpm build` — all clean. The Copilot stays a clean client island (imports only the leaf `markdown` component; no server-only barrels).

## Honest notes
- Answer *quality/structure* depends on the live model (needs `ANTHROPIC_API_KEY`, set in prod); the renderer + prompt make structured output the default, and the renderer degrades gracefully on any text.
- `next/image` serves the local mascot/FAB webp from `/public` (no remote config needed).
