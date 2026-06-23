/**
 * Strength/weakness derivation from the seven sub-scores (Phase 4). Pure and
 * deterministic: highest dimensions (>= floor) are strengths, lowest (< ceiling)
 * are weaknesses, ties broken by key for stable ordering. N/A dimensions
 * (Equipment below TH16) are excluded.
 */

import type { SubScoreKey, SubScores } from '@/lib/core';
import type { ReportStrength, ReportWeakness, SubScoreView } from './types';

export const SUBSCORE_LABELS: Readonly<Record<SubScoreKey, string>> = {
  heroes: 'Heroes',
  offense: 'Offense',
  defense: 'Defense',
  equipment: 'Equipment',
  progression: 'Progression / Rush',
  walls: 'Walls',
  clanValue: 'Clan Value',
};

export const SUBSCORE_ORDER: readonly SubScoreKey[] = [
  'heroes',
  'offense',
  'defense',
  'equipment',
  'progression',
  'walls',
  'clanValue',
];

const STRENGTH_FLOOR = 80;
const WEAKNESS_CEILING = 70;

export function toSubScoreViews(subScores: SubScores): SubScoreView[] {
  return SUBSCORE_ORDER.map((key) => ({
    key,
    label: SUBSCORE_LABELS[key],
    value: subScores[key],
  }));
}

function presentScores(
  subScores: SubScores,
): { key: SubScoreKey; value: number }[] {
  const out: { key: SubScoreKey; value: number }[] = [];
  for (const key of SUBSCORE_ORDER) {
    const value = subScores[key];
    if (value !== null) out.push({ key, value });
  }
  return out;
}

export function deriveStrengths(
  subScores: SubScores,
  limit = 3,
): ReportStrength[] {
  return presentScores(subScores)
    .filter((s) => s.value >= STRENGTH_FLOOR)
    .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map(({ key, value }) => ({
      key,
      label: SUBSCORE_LABELS[key],
      value: Math.round(value),
    }));
}

export function deriveWeaknesses(
  subScores: SubScores,
  limit = 3,
): ReportWeakness[] {
  return presentScores(subScores)
    .filter((s) => s.value < WEAKNESS_CEILING)
    .sort((a, b) => a.value - b.value || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map(({ key, value }) => ({
      key,
      label: SUBSCORE_LABELS[key],
      value: Math.round(value),
    }));
}
