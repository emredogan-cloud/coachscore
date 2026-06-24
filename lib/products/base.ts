/**
 * BaseDoctor engine (Phase 6). Deterministic base audit from a structured layout
 * description: weaknesses, trap recommendations, anti-meta suggestions, an
 * improvement roadmap, and a defense-readiness score. Pure.
 */

import { clamp } from '@/lib/core';
import type { ProductAnalysis, ProductSection } from './types';

export interface BaseCoreBuilding {
  readonly name: string;
  readonly centralized: boolean;
}

export interface BaseInput {
  readonly townHall: number;
  readonly layoutType: 'war' | 'farm' | 'hybrid' | 'trophy';
  readonly goal:
    | 'war_defense'
    | 'trophy_push'
    | 'resource_protection'
    | 'general';
  readonly townHallCentralized: boolean;
  readonly coreBuildings: readonly BaseCoreBuilding[];
  readonly airDefenseCount: number;
  readonly airDefenseSpread: boolean;
  readonly trapCount: number;
  readonly wallsMaxed: boolean;
  readonly screenshotsCount: number;
  readonly notes?: string;
}

export function analyzeBase(input: BaseInput): ProductAnalysis {
  const expectedTraps = Math.max(6, input.townHall);
  const uncentralizedCore = input.coreBuildings
    .filter((b) => !b.centralized)
    .map((b) => b.name);

  const weaknesses: string[] = [];
  if (
    !input.townHallCentralized &&
    (input.goal === 'war_defense' || input.goal === 'trophy_push')
  ) {
    weaknesses.push(
      'Town Hall is exposed — centralize it for war/trophy defense.',
    );
  }
  if (!input.airDefenseSpread) {
    weaknesses.push(
      'Air defenses are clustered — spread them so one funnel cannot remove them all.',
    );
  }
  if (uncentralizedCore.length > 0) {
    weaknesses.push(
      `Exposed core defenses (${uncentralizedCore.join(', ')}) — pull them toward the core.`,
    );
  }
  if (!input.wallsMaxed) {
    weaknesses.push(
      'Walls are not maxed — upgrade them to slow ground armies into your traps.',
    );
  }
  if (weaknesses.length === 0) {
    weaknesses.push(
      'No structural weaknesses detected — focus on trap placement and meta counters.',
    );
  }

  const trapRecs: string[] = [];
  if (input.trapCount < expectedTraps) {
    trapRecs.push(
      `Add traps — ~${input.trapCount}/${expectedTraps} placed; cluster spring traps on likely funnel paths.`,
    );
  }
  trapRecs.push('Place giant bombs in the core to punish healers and bowlers.');
  trapRecs.push(
    'Use seeking air mines against dragon/electro spam at TH-appropriate levels.',
  );

  const antiMeta: string[] = [];
  antiMeta.push(
    input.goal === 'war_defense' || input.layoutType === 'war'
      ? 'Counter the ground meta (hybrid / queen-charge): split compartments and protect the queen-walk entry side.'
      : 'Counter air spam with spread, leveled air defenses plus seeking air mines.',
  );
  antiMeta.push(
    'Asymmetric compartments slow no-fail ground pushes — avoid open ringed bases.',
  );

  const roadmap: string[] = [
    '1. Centralize the Town Hall + core defenses.',
    '2. Spread and level the air defenses.',
    '3. Fill trap slots on the likely funnel paths.',
    '4. Max the walls in the core compartments.',
  ];

  let score = 100;
  if (!input.townHallCentralized) score -= 20;
  if (!input.airDefenseSpread) score -= 15;
  score -= uncentralizedCore.length * 8;
  if (!input.wallsMaxed) score -= 10;
  if (input.trapCount < expectedTraps) score -= 10;
  score = clamp(score, 0, 100);

  const sections: ProductSection[] = [
    { key: 'weaknesses', title: 'Weakness analysis', items: weaknesses },
    { key: 'traps', title: 'Trap recommendations', items: trapRecs },
    { key: 'anti_meta', title: 'Anti-meta suggestions', items: antiMeta },
    { key: 'roadmap', title: 'Improvement roadmap', items: roadmap },
  ];

  return {
    score: { label: 'Defense readiness', value: score },
    summary:
      `TH${input.townHall} ${input.layoutType} base for ${input.goal}: ` +
      `defense readiness ${score}/100.`,
    sections,
    recommendations: roadmap,
  };
}
