/**
 * WarPlan engine (Phase 6). Deterministic pre-war attack plan from the enemy
 * base, the attacker's roster, and the objective: a step plan, recommended army,
 * spell + hero timing, contingencies, and a three-star probability estimate. Pure.
 */

import { clamp } from '@/lib/core';
import type { ProductAnalysis, ProductSection } from './types';

export interface WarRoster {
  readonly army: string;
  readonly heroes: readonly string[];
  readonly armyStrength: 'low' | 'medium' | 'high';
}

export interface WarInput {
  readonly attackerTownHall: number;
  readonly defenderTownHall: number;
  readonly defenderBaseType:
    | 'ring'
    | 'compartment'
    | 'anti_air'
    | 'anti_ground'
    | 'unknown';
  readonly objective: 'three_star' | 'two_star' | 'cleanup';
  readonly roster: WarRoster;
  readonly spellsAvailable: readonly string[];
}

export function buildWarPlan(input: WarInput): ProductAnalysis {
  const thGap = input.defenderTownHall - input.attackerTownHall;

  const plan: string[] = [
    'Scout the weakest compartment and the air-defense layout before deploying.',
    input.defenderBaseType === 'anti_ground'
      ? 'Open from the side with the fewest point defenses using an air-heavy entry.'
      : 'Create a funnel on both sides so the core army stays on the intended path.',
    'Commit heroes once the funnel holds; keep the Warden behind the tank line.',
    'Spend cleanup troops on the final compartment to secure the third star.',
  ];

  const army: string[] = [
    `Recommended: ${input.roster.army} — your strongest available army for this matchup.`,
    thGap >= 1
      ? 'You are dipping down — favor a forgiving, high-value army (hybrid or a strong air comp).'
      : 'Even or up matchup — bring your highest skill-ceiling army for maximum stars.',
  ];

  const spellTiming: string[] = [];
  if (input.spellsAvailable.includes('rage')) {
    spellTiming.push(
      'Rage: drop on the core push when troops bunch at the first big compartment.',
    );
  }
  if (input.spellsAvailable.includes('heal')) {
    spellTiming.push(
      'Heal: save for multi-target defenses (multi-mortar / scattershot), not single hits.',
    );
  }
  if (input.spellsAvailable.includes('freeze')) {
    spellTiming.push(
      'Freeze: hold for inferno towers / scattershots as your heroes pass them.',
    );
  }
  if (spellTiming.length === 0) {
    spellTiming.push(
      'Sequence spells to protect the main push through the two highest-DPS defenses.',
    );
  }

  const heroTiming: string[] = [
    'Deploy heroes after the funnel is set, not on the first tap.',
    'Use the Warden ability (or equivalent) just before entering inferno/scattershot range.',
  ];

  const contingency: string[] = [
    'If the funnel fails, pivot heroes to the open side rather than forcing the core.',
    'If the timer runs short, secure the Town Hall + one compartment for a safe two-star.',
  ];
  if (input.objective === 'cleanup') {
    contingency.push(
      'Cleanup objective: target the remaining percentage efficiently; do not over-commit heroes.',
    );
  }

  let prob = 60;
  if (input.roster.armyStrength === 'high') prob += 15;
  else if (input.roster.armyStrength === 'low') prob -= 15;
  prob -= thGap * 12;
  if (input.objective === 'two_star') prob += 10;
  else if (input.objective === 'cleanup') prob += 15;
  prob = clamp(prob, 5, 95);

  const sections: ProductSection[] = [
    { key: 'plan', title: 'Attack plan', items: plan },
    { key: 'army', title: 'Recommended army', items: army },
    { key: 'spell_timing', title: 'Spell timing', items: spellTiming },
    { key: 'hero_timing', title: 'Hero timing', items: heroTiming },
    { key: 'contingency', title: 'Contingency plans', items: contingency },
  ];

  return {
    score: { label: 'Estimated three-star probability', value: prob },
    summary:
      `TH${input.attackerTownHall} → TH${input.defenderTownHall} (${input.objective}): ` +
      `~${prob}% three-star estimate.`,
    sections,
    recommendations: plan.slice(0, 3),
  };
}
