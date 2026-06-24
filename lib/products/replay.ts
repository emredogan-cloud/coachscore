/**
 * ReplayDoctor engine (Phase 6). Deterministic attack-replay analysis from
 * structured battle metadata: an attack score plus mistakes, timing, and a
 * diagnosis. Pure — a function of the input only. AI enrichment is optional.
 */

import { clamp } from '@/lib/core';
import type { ProductAnalysis, ProductSection } from './types';

export interface ReplayTroop {
  readonly name: string;
  readonly count: number;
}

export interface ReplayInput {
  readonly townHall: number;
  readonly context: 'war' | 'multiplayer' | 'cwl' | 'friendly';
  readonly starsEarned: number;
  readonly destructionPct: number;
  readonly durationSec: number;
  readonly timeRemainingSec: number;
  readonly army: readonly ReplayTroop[];
  readonly heroesUsed: readonly string[];
  readonly heroesAvailable: readonly string[];
  readonly spellsUsed: readonly string[];
  readonly notes?: string;
}

export function analyzeReplay(input: ReplayInput): ProductAnalysis {
  const stars = clamp(Math.round(input.starsEarned), 0, 3);
  const destruction = clamp(input.destructionPct, 0, 100);
  const timeEff =
    input.durationSec > 0
      ? clamp((input.timeRemainingSec / input.durationSec) * 100, 0, 100)
      : 0;
  // A three-star is a perfect attack; otherwise weight stars + destruction + speed.
  const score =
    stars === 3
      ? 100
      : clamp(
          Math.round(
            0.6 * (stars / 3) * 100 + 0.3 * destruction + 0.1 * timeEff,
          ),
          0,
          100,
        );

  const mistakes: string[] = [];
  const unusedHeroes = input.heroesAvailable.filter(
    (h) => !input.heroesUsed.includes(h),
  );
  if (unusedHeroes.length > 0) {
    mistakes.push(
      `Did not deploy all heroes (${unusedHeroes.join(', ')}) — heroes are your biggest damage lever.`,
    );
  }
  if (input.spellsUsed.length === 0) {
    mistakes.push(
      'No spells were used — spells convert stalled pushes into stars.',
    );
  }
  if (input.timeRemainingSec <= 5 && stars < 3) {
    mistakes.push(
      'Ran the clock down without a three-star — deployment was likely too slow or the funnel failed.',
    );
  }
  if (destruction < 50) {
    mistakes.push(
      'Low destruction — the attack broke down early; review the opening funnel and entry point.',
    );
  }
  if (stars === 2 && destruction >= 50) {
    mistakes.push(
      'Two-star with solid destruction — the cleanup phase failed to reach the third star.',
    );
  }
  if (mistakes.length === 0) {
    mistakes.push(
      'No major mechanical mistakes detected — refine micro and target selection.',
    );
  }

  const timing: string[] = [];
  timing.push(
    input.timeRemainingSec > 0
      ? `Finished with ${input.timeRemainingSec}s to spare.`
      : 'Used the full attack timer.',
  );
  if (timeEff < 10 && stars < 3) {
    timing.push(
      'Very little spare time — deploy faster or commit heroes earlier.',
    );
  }

  const diagnosis: string[] = [];
  diagnosis.push(
    stars === 3
      ? 'Three-star attack — replicate this composition and timing.'
      : stars === 2
        ? 'Two-star — the strategy works but execution is leaking a star.'
        : stars === 1
          ? 'One-star — the composition or entry point needs rethinking.'
          : 'Zero-star — wrong army or base read; change the approach.',
  );

  const sections: ProductSection[] = [
    { key: 'mistakes', title: 'Mistakes', items: mistakes },
    { key: 'timing', title: 'Timing analysis', items: timing },
    { key: 'diagnosis', title: 'Attack diagnosis', items: diagnosis },
  ];

  const recommendations = mistakes
    .filter((m) => !m.startsWith('No major'))
    .slice(0, 3)
    .map((m) => `Fix: ${m}`);

  return {
    score: { label: 'Attack score', value: score },
    summary:
      `TH${input.townHall} ${input.context} attack: ${stars}★, ` +
      `${Math.round(destruction)}% — attack score ${score}/100.`,
    sections,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ['Keep practicing this composition and tighten target selection.'],
  };
}
