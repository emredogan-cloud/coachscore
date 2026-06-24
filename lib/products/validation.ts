/**
 * Product input validation (Phase 6). Per-SKU Zod schemas + a `parseProductInput`
 * that narrows the untrusted body to a typed, analysis-ready `ProductInput`.
 */

import { z } from 'zod';
import type { BaseInput } from './base';
import type { ReplayInput } from './replay';
import type { WarInput } from './war';
import { PRODUCT_SKUS, type ProductSku } from './types';

export const ProductSkuSchema = z.enum(PRODUCT_SKUS);

const replayTroop = z.object({
  name: z.string().min(1).max(40),
  count: z.number().int().min(0).max(500),
});

export const ReplayInputSchema = z.object({
  townHall: z.number().int().min(1).max(20),
  context: z.enum(['war', 'multiplayer', 'cwl', 'friendly']),
  starsEarned: z.number().int().min(0).max(3),
  destructionPct: z.number().min(0).max(100),
  durationSec: z.number().min(0).max(600),
  timeRemainingSec: z.number().min(0).max(600),
  army: z.array(replayTroop).max(50).default([]),
  heroesUsed: z.array(z.string().min(1)).max(8).default([]),
  heroesAvailable: z.array(z.string().min(1)).max(8).default([]),
  spellsUsed: z.array(z.string().min(1)).max(20).default([]),
  notes: z.string().max(2000).optional(),
});

const coreBuilding = z.object({
  name: z.string().min(1).max(40),
  centralized: z.boolean(),
});

export const BaseInputSchema = z.object({
  townHall: z.number().int().min(1).max(20),
  layoutType: z.enum(['war', 'farm', 'hybrid', 'trophy']),
  goal: z.enum([
    'war_defense',
    'trophy_push',
    'resource_protection',
    'general',
  ]),
  townHallCentralized: z.boolean(),
  coreBuildings: z.array(coreBuilding).max(40).default([]),
  airDefenseCount: z.number().int().min(0).max(12),
  airDefenseSpread: z.boolean(),
  trapCount: z.number().int().min(0).max(60),
  wallsMaxed: z.boolean(),
  screenshotsCount: z.number().int().min(0).max(20).default(0),
  notes: z.string().max(2000).optional(),
});

export const WarInputSchema = z.object({
  attackerTownHall: z.number().int().min(1).max(20),
  defenderTownHall: z.number().int().min(1).max(20),
  defenderBaseType: z.enum([
    'ring',
    'compartment',
    'anti_air',
    'anti_ground',
    'unknown',
  ]),
  objective: z.enum(['three_star', 'two_star', 'cleanup']),
  roster: z.object({
    army: z.string().min(1).max(80),
    heroes: z.array(z.string().min(1)).max(8).default([]),
    armyStrength: z.enum(['low', 'medium', 'high']),
  }),
  spellsAvailable: z.array(z.string().min(1)).max(20).default([]),
});

export const ProductSubmissionSchema = z.object({
  sku: ProductSkuSchema,
  input: z.unknown(),
  context: z.string().max(500).optional(),
  uploadKeys: z.array(z.string().min(1).max(300)).max(20).optional(),
});

export type ProductInput =
  | { readonly sku: 'replay_doctor'; readonly input: ReplayInput }
  | { readonly sku: 'base_doctor'; readonly input: BaseInput }
  | { readonly sku: 'war_plan'; readonly input: WarInput };

export type ProductInputParse =
  | { readonly ok: true; readonly value: ProductInput }
  | { readonly ok: false; readonly errors: readonly string[] };

function issues(error: z.ZodError): string[] {
  return error.issues.map((i) =>
    i.path.length > 0 ? `${i.path.join('.')}: ${i.message}` : i.message,
  );
}

export function parseProductInput(
  sku: ProductSku,
  rawInput: unknown,
): ProductInputParse {
  switch (sku) {
    case 'replay_doctor': {
      const parsed = ReplayInputSchema.safeParse(rawInput);
      return parsed.success
        ? { ok: true, value: { sku, input: parsed.data } }
        : { ok: false, errors: issues(parsed.error) };
    }
    case 'base_doctor': {
      const parsed = BaseInputSchema.safeParse(rawInput);
      return parsed.success
        ? { ok: true, value: { sku, input: parsed.data } }
        : { ok: false, errors: issues(parsed.error) };
    }
    case 'war_plan': {
      const parsed = WarInputSchema.safeParse(rawInput);
      return parsed.success
        ? { ok: true, value: { sku, input: parsed.data } }
        : { ok: false, errors: issues(parsed.error) };
    }
  }
}
