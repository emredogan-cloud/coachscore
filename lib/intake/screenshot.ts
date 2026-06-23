/**
 * Screenshot intake path (Phase 3).
 *
 * Wires the existing Phase-2 OCR pipeline into intake: extract visible fields →
 * apply user corrections → route by confidence → map to `IntakeFields` → shared
 * normalize + snapshot tail. The AI provider is injected, so the logic is fully
 * unit-tested without a key; the live path needs `ANTHROPIC_API_KEY`.
 */

import type { Goal } from '@/lib/core';
import {
  extractAccountFromScreenshots,
  type AiProvider,
  type ExtractedField,
  type ProviderImage,
} from '@/lib/ai';
import type { HeroId } from '@/lib/game-data';
import { extractionConfidence } from './confidence';
import { buildIntakeResult } from './result';
import type {
  ClanSignals,
  EquipmentFields,
  IntakeFields,
  IntakeResult,
} from './types';

export interface ScreenshotIntakeDeps {
  readonly provider: AiProvider;
}

export interface ScreenshotIntakeInput {
  readonly images: readonly ProviderImage[];
  readonly context: string;
  readonly townHall: number;
  readonly goal: Goal;
  /** Clan signals (not visible in screenshots) collected separately. */
  readonly clan?: ClanSignals;
  /** User corrections keyed by extracted field key (override + trust). */
  readonly corrections?: Record<string, number>;
}

const HERO_KEYS: readonly HeroId[] = [
  'barbarianKing',
  'archerQueen',
  'grandWarden',
  'royalChampion',
  'minionPrince',
  'dragonDuke',
];

const NEUTRAL_CLAN: ClanSignals = {
  donationBehavior: 0.5,
  warContribution: 0.5,
  capitalContribution: 0.5,
  activitySignal: 0.5,
};

/** Apply user corrections: override value, mark fully trusted. */
export function applyCorrections(
  fields: readonly ExtractedField[],
  corrections: Record<string, number>,
): ExtractedField[] {
  const byKey = new Map<string, ExtractedField>(fields.map((f) => [f.key, f]));
  for (const [key, value] of Object.entries(corrections)) {
    byKey.set(key, { key, value, confidence: 1, needsConfirmation: false });
  }
  return [...byKey.values()];
}

/** Map confidence-routed extracted fields onto the intake field shape. */
export function mapExtractedToFields(
  fields: readonly ExtractedField[],
  townHall: number,
  clan: ClanSignals,
): IntakeFields {
  const value = new Map<string, number>(fields.map((f) => [f.key, f.value]));
  const get = (key: string, fallback: number): number =>
    value.get(key) ?? fallback;

  const heroLevels: Partial<Record<HeroId, number>> = {};
  for (const id of HERO_KEYS) {
    const v = value.get(id);
    if (v !== undefined) heroLevels[id] = v;
  }

  const hasEquipment =
    value.has('equipmentKeyEpicsUnlocked') ||
    value.has('equipmentLevelSum') ||
    value.has('equipmentMaxLevelSum');
  const equipment: EquipmentFields | undefined = hasEquipment
    ? {
        keyEpicsUnlocked: get('equipmentKeyEpicsUnlocked', 0),
        levelSum: get('equipmentLevelSum', 0),
        maxLevelSum: get('equipmentMaxLevelSum', 0),
      }
    : undefined;

  return {
    townHall,
    heroLevels,
    offensePercent: get('offensePercent', 0),
    defensePercent: get('defensePercent', 0),
    progressionPercent: get('progressionPercent', 0),
    walls: {
      atOrAboveThMax: get('wallsAtOrAboveThMax', 0),
      total: get('wallsTotal', 0),
    },
    equipment,
    clan,
  };
}

export async function intakeByScreenshot(
  input: ScreenshotIntakeInput,
  deps: ScreenshotIntakeDeps,
): Promise<IntakeResult> {
  const extraction = await extractAccountFromScreenshots(
    input.images,
    input.context,
    { provider: deps.provider },
  );
  const corrected = applyCorrections(
    extraction.fields,
    input.corrections ?? {},
  );
  const fields = mapExtractedToFields(
    corrected,
    input.townHall,
    input.clan ?? NEUTRAL_CLAN,
  );
  const { score, fieldsNeedingConfirmation } = extractionConfidence(corrected);

  return buildIntakeResult('screenshot', fields, input.goal, {
    confidence: score,
    fieldsNeedingConfirmation,
    note: 'screenshot OCR',
  });
}
