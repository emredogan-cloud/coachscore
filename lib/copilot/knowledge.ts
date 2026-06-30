/**
 * CoachScore Copilot — grounded knowledge + system prompt (COPILOT-P0).
 *
 * Modeled on the Lumina assistant pattern: instead of vector RAG, we inject a
 * compact, data-driven "knowledge map" built from the SAME single sources of
 * truth the app renders from (score weights, the verified reference table, the
 * grade bands, the pricing catalog, the guide inventory). Because it reads the
 * live data, the Copilot's facts cannot drift from the product and update on
 * deploy. These facts are declared GROUND TRUTH in the prompt and the model is
 * forbidden from inventing game numbers/prices — the anti-hallucination spine.
 * Pure + testable.
 */

import { GRADE_BANDS } from '@/lib/core/grade';
import {
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
  getTownHallReference,
} from '@/lib/game-data';
import { ALL_HERO_IDS } from '@/lib/game-data';
import { PRIMARY_PRICING, formatPrice } from '@/lib/pricing';

const HERO_LABEL: Record<string, string> = {
  barbarianKing: 'Barbarian King',
  archerQueen: 'Archer Queen',
  grandWarden: 'Grand Warden',
  royalChampion: 'Royal Champion',
  minionPrince: 'Minion Prince',
  dragonDuke: 'Dragon Duke',
};

const DIMENSIONS =
  'heroes, offense, defense, equipment (TH16+), progression/rush, walls, clan value';

/** Verified hero caps line for a Town Hall, from the reference table. */
function heroCapsLine(th: number): string {
  const ref = getTownHallReference(th);
  const caps = ALL_HERO_IDS.filter((id) => ref.heroes[id].unlocked)
    .map((id) => `${HERO_LABEL[id] ?? id} ${ref.heroes[id].maxLevel}`)
    .join(', ');
  return `TH${th}: ${caps}`;
}

/** Build the compact, data-derived knowledge block (ground truth). */
export function buildKnowledgeMap(): string {
  const grades = GRADE_BANDS.map(
    (b) => `${b.grade} (${b.min}${b.max === 100 ? '+' : `–${b.max}`})`,
  ).join(', ');
  const pricing = PRIMARY_PRICING.map(
    (t) => `${t.name} ${formatPrice(t)}`,
  ).join(', ');
  return [
    '# COACHSCORE FACTS (ground truth — never contradict or invent beyond these)',
    `- What it does: rates a Clash of Clans account on 7 dimensions (${DIMENSIONS}) and gives a prioritized, goal-aware upgrade roadmap.`,
    `- Input: paste your player tag (read automatically via the official API) — manual entry is the fallback. Defense & walls aren't readable from the API and need a screenshot.`,
    `- Grades: ${grades}.`,
    `- Supported Town Halls: ${MIN_TOWN_HALL}–${MAX_TOWN_HALL}. Verified hero caps:`,
    `  ${heroCapsLine(16)}`,
    `  ${heroCapsLine(17)}`,
    `  ${heroCapsLine(18)}`,
    `- Pricing (one-time, no subscription): ${pricing}. The free score + biggest weakness needs no account.`,
    `- The score is from a transparent, DETERMINISTIC engine (same inputs → same score). Not affiliated with Supercell.`,
  ].join('\n');
}

/** The full system prompt: persona + guardrails + the knowledge map. */
export function buildCopilotSystemPrompt(): string {
  return [
    'You are the CoachScore Copilot: a sharp, friendly Clash of Clans coaching assistant embedded in the CoachScore app.',
    '',
    'VOICE: lead with substance, no filler ("Great question!", "As an AI…"). Answer in the language the user writes in.',
    '',
    'FORMAT (important): reply in short, scannable markdown — NEVER one long paragraph. Prefer a one-line lead, then **bold** key terms, short bullet lists (`-`), or numbered steps (`1.`) for anything sequential. Use a `### subheading` only when an answer has clear parts, and a markdown table for side-by-side comparisons. Keep it tight.',
    '',
    'HARD RULES (a violation makes you useless):',
    '1. NEVER invent game numbers (hero/troop caps, costs), prices, or features. Use ONLY the facts below. If a fact is not given, say you are not certain rather than guess.',
    '2. Help with: how CoachScore works, reading scores/reports, pricing, and general Clash of Clans strategy/upgrade advice.',
    '3. For upgrade advice, reason from the 7 dimensions and the goal the player states; recommend pasting their tag for an exact, personalized roadmap.',
    '4. Stay in scope (CoachScore + Clash of Clans). Politely decline unrelated requests.',
    '5. Be honest about limits: defense & walls need a screenshot; only TH11–18 are supported; verified data is TH16–18.',
    '',
    buildKnowledgeMap(),
  ].join('\n');
}
