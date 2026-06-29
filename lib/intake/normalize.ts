/**
 * Normalization: raw `IntakeFields` → engine `NormalizedAccount` (Phase 3).
 *
 * This is the bridge from intake to the deterministic scoring engine (ADR
 * 0003). Hero caps + DE-cost weights and equipment availability/totals come
 * from the Game-Data Reference Table (ADR 0004) — never guessed here — while
 * offense/defense/progression are carried as representative completion. Pure:
 * a function of (fields, reference) only.
 */

import { clamp } from '@/lib/core';
import type {
  EquipmentInput,
  HeroInput,
  NormalizedAccount,
  WeightedElement,
} from '@/lib/core';
import { ALL_HERO_IDS, getTownHallReference } from '@/lib/game-data';
import type { IntakeFields } from './types';

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

/** A 0..100 representative completion carried as a single weighted element. */
function percentElement(id: string, percent: number): WeightedElement {
  return { id, level: clamp(percent, 0, 100), maxLevel: 100, weight: 1 };
}

/**
 * Turn captured fields into a fully normalized account. Throws (via
 * `getTownHallReference`) only if the Town Hall is outside the supported range;
 * callers validate the range first.
 */
export function normalizeIntake(fields: IntakeFields): NormalizedAccount {
  const ref = getTownHallReference(fields.townHall);

  const heroes: HeroInput[] = [];
  for (const id of ALL_HERO_IDS) {
    const cap = ref.heroes[id];
    if (!cap.unlocked) continue;
    const level = clamp(fields.heroLevels[id] ?? 0, 0, cap.maxLevel);
    heroes.push({
      id,
      level,
      maxLevel: cap.maxLevel,
      deCostWeight: cap.deCostWeight,
    });
  }

  const equipment: EquipmentInput =
    ref.equipment.available && fields.equipment
      ? {
          available: true,
          keyEpicsUnlocked: clamp(
            fields.equipment.keyEpicsUnlocked,
            0,
            ref.equipment.keyEpicsTotal,
          ),
          keyEpicsTotal: ref.equipment.keyEpicsTotal,
          levelSum: Math.max(0, fields.equipment.levelSum),
          maxLevelSum: Math.max(0, fields.equipment.maxLevelSum),
        }
      : {
          available: false,
          keyEpicsUnlocked: 0,
          keyEpicsTotal: 0,
          levelSum: 0,
          maxLevelSum: 0,
        };

  const unknown = new Set(fields.unknownDimensions ?? []);

  return {
    townHall: fields.townHall,
    heroes,
    offense: [percentElement('meta-offense', fields.offensePercent)],
    // "Unknown" dimensions (e.g. defenses/walls the official API can't read) are
    // left absent so the engine drops + renormalizes them rather than scoring an
    // unobserved dimension as zero.
    defense: unknown.has('defense')
      ? []
      : [percentElement('key-defense', fields.defensePercent)],
    walls: unknown.has('walls')
      ? { atOrAboveThMax: 0, total: 0 }
      : {
          atOrAboveThMax: Math.max(0, Math.floor(fields.walls.atOrAboveThMax)),
          total: Math.max(0, Math.floor(fields.walls.total)),
        },
    equipment,
    clan: {
      donationBehavior: clamp01(fields.clan.donationBehavior),
      warContribution: clamp01(fields.clan.warContribution),
      capitalContribution: clamp01(fields.clan.capitalContribution),
      activitySignal: clamp01(fields.clan.activitySignal),
    },
    progression: [
      percentElement(`vs-th${ref.previousTownHall}`, fields.progressionPercent),
    ],
  };
}
