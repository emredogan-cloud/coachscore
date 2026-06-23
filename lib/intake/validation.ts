/**
 * Zod validation for intake requests (Phase 3).
 *
 * The boundary between untrusted request bodies and the typed intake domain.
 * Goal + hero-id literals are duplicated here as Zod tuples (Zod needs literal
 * tuples) and guarded by tests against the engine's canonical lists, so they
 * cannot silently drift.
 */

import { z } from 'zod';
import { MAX_TOWN_HALL, MIN_TOWN_HALL } from '@/lib/game-data';

export const GOAL_VALUES = [
  'progress',
  'war',
  'trophy',
  'derush',
  'recruit',
  'rate',
] as const;

export const HERO_ID_VALUES = [
  'barbarianKing',
  'archerQueen',
  'grandWarden',
  'royalChampion',
  'minionPrince',
  'dragonDuke',
] as const;

export const GoalSchema = z.enum(GOAL_VALUES);
const HeroIdSchema = z.enum(HERO_ID_VALUES);

const unit = z.number().min(0).max(1);
const percent = z.number().min(0).max(100);

const ClanSchema = z.object({
  donationBehavior: unit,
  warContribution: unit,
  capitalContribution: unit,
  activitySignal: unit,
});

const EquipmentSchema = z.object({
  keyEpicsUnlocked: z.number().int().min(0),
  levelSum: z.number().min(0),
  maxLevelSum: z.number().min(0),
});

export const IntakeFieldsSchema = z.object({
  townHall: z.number().int().min(MIN_TOWN_HALL).max(MAX_TOWN_HALL),
  heroLevels: z.record(HeroIdSchema, z.number().int().min(0).max(200)),
  offensePercent: percent,
  defensePercent: percent,
  progressionPercent: percent,
  walls: z.object({
    atOrAboveThMax: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  equipment: EquipmentSchema.optional(),
  clan: ClanSchema,
});

export const ManualIntakeSchema = z.object({
  goal: GoalSchema,
  fields: IntakeFieldsSchema,
});

export const TagIntakeSchema = z.object({
  goal: GoalSchema,
  playerTag: z.string().min(1).max(20),
});

export const ScreenshotIntakeSchema = z.object({
  goal: GoalSchema,
  townHall: z.number().int().min(MIN_TOWN_HALL).max(MAX_TOWN_HALL),
  context: z.string().max(2000).default(''),
  clan: ClanSchema.optional(),
  corrections: z.record(z.string(), z.number()).optional(),
});

export const ProviderImageSchema = z.object({
  mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  dataBase64: z.string().min(1),
});

/** Full screenshot request: intake fields + the attached image payloads. */
export const ScreenshotRequestSchema = ScreenshotIntakeSchema.extend({
  images: z.array(ProviderImageSchema).min(1).max(8),
});

export type ManualIntakeBody = z.infer<typeof ManualIntakeSchema>;
export type TagIntakeBody = z.infer<typeof TagIntakeSchema>;
export type ScreenshotIntakeBody = z.infer<typeof ScreenshotIntakeSchema>;
export type ScreenshotRequestBody = z.infer<typeof ScreenshotRequestSchema>;
