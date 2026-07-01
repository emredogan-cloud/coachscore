/**
 * Premium decorative-asset pipeline (immersion sprint · Section 1).
 *
 * Reusable, cached, deterministic generator for ORIGINAL DECORATIVE assets only
 * — frames, auras, particles, borders, dividers, empty-state art, badges, glow
 * overlays. It NEVER generates Clash of Clans game entities (Town Halls, heroes,
 * troops, defenses) — those are Supercell IP and must stay truthful / real
 * (see the IP rules in the sprint prompt and the project's Supercell-compliance
 * notes). OpenAI `gpt-image-1` is used strictly for the decorative set below.
 *
 * Properties:
 *  - Deterministic naming: each asset's `name` IS its filename. Re-runs are
 *    free — an asset whose `.webp` already exists is SKIPPED (local cache).
 *  - Optimized output: PNG from the API is converted to small WebP via
 *    ImageMagick (`convert`) and the PNG is removed; transparency is preserved.
 *  - Self-documenting: writes `public/assets/generated/manifest.json`.
 *  - Safe: with no OPENAI_API_KEY it logs and exits 0 (this is build-time
 *    tooling, never part of `next build`). No fabricated assets, no fake calls.
 *
 * Run:  pnpm assets:generate   (or: OPENAI_API_KEY=… tsx scripts/generate-premium-assets.ts)
 * Key:  reads OPENAI_API_KEY (standard) or OPEN_AI_API_KEY, else parses .env.local.
 */

/* eslint-disable no-console -- CLI script; console output is the UI */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

interface AssetSpec {
  readonly name: string;
  readonly prompt: string;
  readonly size: '1024x1024' | '1024x1536' | '1536x1024';
  readonly transparent: boolean;
  readonly quality: 'low' | 'medium' | 'high';
  /** Longest edge of the optimized webp (px). */
  readonly maxEdge: number;
  /** Where/how it's used (documentation). */
  readonly usage: string;
}

const OUT = join(process.cwd(), 'public/assets/generated');

/**
 * The decorative manifest. Prompts are deliberately abstract/fantasy — NO Clash
 * of Clans characters, buildings, logos, or trademarked elements.
 */
const ASSETS: readonly AssetSpec[] = [
  {
    name: 'frame-premium',
    prompt:
      'An ornate premium card frame border, only the border (fully transparent center), deep violet (#a855f7) and luminous gold (#e8b339) metallic filigree with subtle inner glow, symmetrical corners, thin elegant fantasy-strategy ornamentation. Transparent background. No text, no characters, no buildings, no logos.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 640,
    usage: 'Premium card frame overlay (report hero, premium tiers).',
  },
  {
    name: 'aura-violet',
    prompt:
      'A soft radial violet (#a855f7) magical aura / energy glow on a fully transparent background, smooth, diffuse, no hard edges, faint gold rim light, abstract. No objects, no text, no characters.',
    size: '1024x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 560,
    usage: 'Glow overlay behind CTAs / score reveal.',
  },
  {
    name: 'particles-gold',
    prompt:
      'Scattered fine gold (#e8b339) magical sparkles and dust particles on a fully transparent background, varied sizes, soft bokeh, premium and subtle, abstract. No objects, no text, no characters.',
    size: '1024x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 640,
    usage: 'Particle overlay for premium reveals / share cards.',
  },
  {
    name: 'divider-ornament',
    prompt:
      'A slim horizontal decorative divider ornament, gold (#e8b339) filigree with a small central violet (#a855f7) gem, symmetrical, elegant fantasy-strategy style, on a fully transparent background. No text, no characters.',
    size: '1536x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 720,
    usage: 'Section divider across report / guides.',
  },
  {
    name: 'empty-state-rune',
    prompt:
      'A glowing arcane crystal/rune emblem (original fantasy, not from any existing game), violet and gold, soft volumetric glow, centered, on a fully transparent background. Premium, calm. No text, no characters, no buildings, no logos.',
    size: '1024x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 480,
    usage: 'Empty-state illustration (no data yet / gated sections).',
  },
  {
    name: 'bg-fantasy-dark',
    prompt:
      'A dark atmospheric premium background texture, near-black (#070510) with faint violet (#a855f7) nebula glow upper area and subtle warm gold ember haze below, smooth gradients, no hard edges, very dark so light text stays readable. Abstract, cinematic. No objects, no text, no characters.',
    size: '1024x1536',
    transparent: false,
    quality: 'medium',
    maxEdge: 800,
    usage: 'Hero / section backdrop (low-opacity layer).',
  },

  // ── Phase 1 · branding identity (original, IP-safe — no Supercell likeness) ──
  {
    name: 'brand-shield-star',
    prompt:
      'A premium emblem: a heraldic shield with a luminous gold (#e8b339) metallic border and a deep violet (#a855f7) gradient field, a single bold gold four-point star/spark centered, subtle inner glow, crisp symmetrical vector-like form, original fantasy-strategy brand mark. Centered, transparent background. No text, no letters, no characters, no existing-game elements.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 512,
    usage: 'Favicon/logo CONCEPT A (reproduced as crisp SVG for production).',
  },
  {
    name: 'brand-shield-crown',
    prompt:
      'A premium emblem: a heraldic shield with a luminous gold (#e8b339) metallic border and a deep violet (#a855f7) gradient field, a small ornate gold crown centered, subtle inner glow, crisp symmetrical vector-like form, original fantasy-strategy brand mark. Centered, transparent background. No text, no letters, no characters, no existing-game elements.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 512,
    usage: 'Favicon/logo CONCEPT B (reproduced as crisp SVG for production).',
  },
  {
    name: 'brand-shield-chevron',
    prompt:
      'A premium emblem: a heraldic shield with a luminous gold (#e8b339) metallic border and a deep violet (#a855f7) gradient field, two stacked bold gold upward chevrons (rank/ascent motif) centered, subtle inner glow, crisp symmetrical vector-like form, original fantasy-strategy brand mark. Centered, transparent background. No text, no letters, no characters, no existing-game elements.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 512,
    usage: 'Favicon/logo CONCEPT C (reproduced as crisp SVG for production).',
  },
  {
    name: 'mascot-tactician',
    prompt:
      'A premium original mascot bust: a noble armored strategist — a sleek fantasy helmet with calm glowing violet (#a855f7) eyes, polished gold (#e8b339) and dark-violet armor, set within a subtle gold-bordered shield silhouette, soft volumetric rim glow, intelligent and trustworthy expression, painted game-quality 3D render style. Original character, NOT from any existing game. Centered, transparent background. No text, no logos, no real-world brands.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 640,
    usage: 'CoachScore Copilot mascot (header + avatar) and brand character.',
  },
  {
    name: 'copilot-fab',
    prompt:
      'A small premium app launcher emblem: a gold (#e8b339) bordered heraldic shield with a deep violet (#a855f7) field containing a simple glowing rounded chat-bubble glyph, soft outer glow, crisp and recognizable at small sizes, original fantasy-strategy style. Centered, transparent background. No text, no letters, no characters, no existing-game elements.',
    size: '1024x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 256,
    usage: 'Floating Copilot launcher button (FAB) emblem.',
  },

  // ── Phase 4 · supplementary decorative scene art (original, IP-safe) ──
  {
    name: 'art-altar-shield',
    prompt:
      'A premium fantasy emblem illustration: a glowing crystalline shield with a deep violet (#a855f7) gem core and luminous gold (#e8b339) trim, floating above a dark stone altar/pedestal with rising violet magical energy and faint gold embers, soft volumetric glow, cinematic, original fantasy-strategy art (NOT from any existing game). Centered on a transparent background. No text, no characters, no buildings, no logos.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 640,
    usage: 'Trust / "why you can trust the grade" section illustration.',
  },
  {
    name: 'art-treasure',
    prompt:
      'A premium fantasy treasure chest, open and overflowing with gold (#e8b339) coins and a few glowing violet (#a855f7) gems, warm inner glow, ornate gold-and-dark-wood chest, original fantasy art (NOT from any existing game), painted game-quality render. Centered on a transparent background. No text, no characters, no buildings, no logos.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 560,
    usage: 'CTA-banner reward illustration (report / pricing / guides).',
  },
  {
    name: 'shield-rescue',
    prompt:
      'A premium emblem: a heraldic shield with a luminous gold (#e8b339) metallic border and a deep violet (#a855f7) gradient field, a stylized gold life-ring / recovery rune centered, subtle inner glow, crisp symmetrical vector-like form, original fantasy-strategy brand mark. Centered, transparent background. No text, no letters, no characters, no existing-game elements.',
    size: '1024x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 320,
    usage:
      'Account Rescue pricing tier emblem (pairs with star/crown shields).',
  },

  // ── Visual Immersion sprint · original fantasy hero/scene art (IP-safe) ──
  // Generic medieval-fantasy — original designs, NOT Clash of Clans. No real
  // game buildings/characters/logos/trade dress. Painted game-quality renders.
  {
    name: 'hero-fortress',
    prompt:
      'A premium isometric fantasy stronghold, an ORIGINAL generic medieval-fantasy castle keep with stone towers, battlements, small violet (#a855f7) and gold (#e8b339) heraldic banners, lit braziers, a central gold-trimmed shield crest, standing on a floating dark rock platform with grass, soft volumetric violet glow and warm ember light, cinematic painted 3D game-quality render. ORIGINAL design — not from any existing game, not Clash of Clans, no recognizable game logos or trademarked buildings. Centered on a fully transparent background. No text, no characters.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 900,
    usage: 'Report + guides hero illustration (grand fortress).',
  },
  {
    name: 'hero-strategy-board',
    prompt:
      'A premium isometric magical strategy board: a dark stone tabletop with a glowing violet (#a855f7) rune grid / battle-plan diagram etched in light, surrounded by an ornate gold (#e8b339) shield, a lit torch, rolled scrolls, an open spellbook, and a small glowing potion, warm and arcane, cinematic painted 3D game-quality render, ORIGINAL fantasy-strategy art (not from any existing game, no Clash of Clans, no trademarked elements). Centered on a fully transparent background. No text, no characters.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 860,
    usage: 'Guides hub hero illustration (strategy planning).',
  },
  {
    name: 'art-spellbook',
    prompt:
      'A premium ornate fantasy spellbook / tome, dark leather and gold (#e8b339) trim, standing open or angled with a glowing violet (#a855f7) gem on the cover and faint magical glow from the pages, painted game-quality 3D render, ORIGINAL design (not from any existing game). Centered on a fully transparent background. No text, no characters, no logos.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 520,
    usage: 'Guide-card + methodology illustration (knowledge / strategy).',
  },
  {
    name: 'art-crystal-shield',
    prompt:
      'A premium floating crystalline heraldic shield trophy, translucent violet (#a855f7) crystal body with luminous gold (#e8b339) metal trim and a small crown or star motif, radiant inner glow and soft sparkles, painted game-quality 3D render, ORIGINAL fantasy design (not from any existing game). Centered on a fully transparent background. No text, no characters, no logos.',
    size: '1024x1024',
    transparent: true,
    quality: 'high',
    maxEdge: 480,
    usage: 'Achievement / rank / guide-card emblem.',
  },
  {
    name: 'art-village',
    prompt:
      'A small humble ORIGINAL medieval-fantasy hamlet: a few modest stone-and-timber cottages with a tiny watchtower on a floating dark rock platform with grass, faint violet (#a855f7) dusk glow, painted game-quality 3D isometric render, ORIGINAL design (not from any existing game, no Clash of Clans, no trademarked buildings). Centered on a fully transparent background. No text, no characters, no logos.',
    size: '1024x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 520,
    usage: 'Guides "before"/recovery storytelling (pairs with hero-fortress).',
  },
  {
    name: 'art-scroll-map',
    prompt:
      'A premium unfurled fantasy map on aged parchment, subtle drawn paths, a small compass rose, wax seal and gold (#e8b339) trim, faint violet (#a855f7) magical glow at the edges, painted game-quality 3D render, ORIGINAL design (not from any existing game). Centered on a fully transparent background. No readable text, no characters, no logos.',
    size: '1536x1024',
    transparent: true,
    quality: 'medium',
    maxEdge: 640,
    usage: 'Roadmap / methodology "the plan" illustration.',
  },
];

function readKey(): string {
  const fromEnv = process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    const env = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*OPEN_?AI_API_KEY\s*=\s*(.*)$/);
      if (m) return (m[1] ?? '').trim().replace(/^"|"$/g, '');
    }
  } catch {
    /* no .env.local */
  }
  return '';
}

function hasImageMagick(): boolean {
  try {
    execFileSync('convert', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function generate(spec: AssetSpec, key: string): Promise<boolean> {
  const webp = join(OUT, `${spec.name}.webp`);
  if (existsSync(webp)) {
    console.log(`• skip ${spec.name} (cached)`);
    return true;
  }
  process.stdout.write(`• generating ${spec.name}… `);
  const body: Record<string, unknown> = {
    model: 'gpt-image-1',
    prompt: spec.prompt,
    size: spec.size,
    quality: spec.quality,
    n: 1,
  };
  if (spec.transparent) body.background = 'transparent';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.log(`FAILED ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return false;
  }
  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    console.log('no image in response');
    return false;
  }
  const png = join(OUT, `${spec.name}.png`);
  writeFileSync(png, Buffer.from(b64, 'base64'));

  if (hasImageMagick()) {
    execFileSync('convert', [
      png,
      '-resize',
      `${spec.maxEdge}x${spec.maxEdge}`,
      '-quality',
      '82',
      '-define',
      'webp:method=6',
      webp,
    ]);
    rmSync(png);
    console.log('OK (webp)');
  } else {
    console.log('OK (png — install ImageMagick for webp)');
  }
  return true;
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const key = readKey();
  if (!key.startsWith('sk-')) {
    console.log(
      'No OPENAI_API_KEY found — skipping generation (this is optional ' +
        'build-time tooling). Set OPENAI_API_KEY to generate.',
    );
    process.exit(0);
  }

  let made = 0;
  for (const spec of ASSETS) {
    try {
      if (await generate(spec, key)) made += 1;
    } catch (err) {
      console.log(`error on ${spec.name}: ${String(err).slice(0, 120)}`);
    }
  }

  // Self-documenting manifest (no timestamp → deterministic / git-clean).
  const manifest = ASSETS.map((a) => ({
    name: a.name,
    file: `public/assets/generated/${a.name}.webp`,
    transparent: a.transparent,
    usage: a.usage,
    prompt: a.prompt,
  }));
  writeFileSync(
    join(OUT, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(
    `\nDone — ${made}/${ASSETS.length} assets present; manifest written.`,
  );
}

void main();
