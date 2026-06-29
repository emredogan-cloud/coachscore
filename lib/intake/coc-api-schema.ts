/**
 * Zod schema for the subset of the official Clash of Clans player response we
 * consume (GET /v1/players/{tag}). Validated at the network boundary so a shape
 * change or partial account never crashes scoring. Everything optional is parsed
 * defensively — fresh/low accounts omit many fields — and unknown/new fields are
 * tolerated (`passthrough`) so a game patch that adds a field doesn't break us.
 *
 * Shape per the authoritative `clashofclans.js` typings (APIPlayer/APIPlayerItem).
 * NOTE: each item's `maxLevel` is the ABSOLUTE in-game max (across all Town
 * Halls), NOT the per-Town-Hall cap — so per-TH completion is computed from the
 * Game-Data Reference Table (heroes), and item ratios are treated as
 * development-toward-max, not "maxed for your TH". See lib/intake/coc-mapper.ts.
 */

import { z } from 'zod';

export const CocPlayerItemSchema = z
  .object({
    name: z.string(),
    level: z.number(),
    maxLevel: z.number(),
    village: z.enum(['home', 'builderBase']).optional(),
    superTroopIsActive: z.boolean().optional(),
  })
  .passthrough();

export const CocPlayerSchema = z
  .object({
    tag: z.string(),
    name: z.string().optional(),
    townHallLevel: z.number().int(),
    expLevel: z.number().optional(),
    trophies: z.number().optional(),
    bestTrophies: z.number().optional(),
    warStars: z.number().optional(),
    attackWins: z.number().optional(),
    defenseWins: z.number().optional(),
    donations: z.number().optional(),
    donationsReceived: z.number().optional(),
    clanCapitalContributions: z.number().optional(),
    warPreference: z.enum(['in', 'out']).optional(),
    role: z.string().optional(),
    clan: z
      .object({ tag: z.string().optional(), name: z.string().optional() })
      .passthrough()
      .optional(),
    troops: z.array(CocPlayerItemSchema).optional().default([]),
    heroes: z.array(CocPlayerItemSchema).optional().default([]),
    spells: z.array(CocPlayerItemSchema).optional().default([]),
    heroEquipment: z.array(CocPlayerItemSchema).optional().default([]),
  })
  .passthrough();

export type CocPlayer = z.infer<typeof CocPlayerSchema>;
export type CocPlayerItem = z.infer<typeof CocPlayerItemSchema>;

/** The official API error envelope: `{ reason, message? }`. */
export const CocErrorSchema = z
  .object({ reason: z.string(), message: z.string().optional() })
  .passthrough();
