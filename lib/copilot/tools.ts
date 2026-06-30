/**
 * Copilot tools (Feature 4 · P1). Typed, validated, strict tool wrappers over the
 * existing pure engines (scoring weights, game-data, the war engine, the SEO
 * guides) — the Lumina pattern: each tool has a zod input schema, returns a
 * token-budgeted plain object, and never throws (errors become `{ error }`). The
 * Anthropic route exposes these so the Copilot answers from real product data,
 * not invention.
 */

import { z } from 'zod';
import {
  computeCoachScore,
  selectWeightProfile,
  type Goal,
  type SubScoreKey,
} from '@/lib/core';
import { normalizeIntake } from '@/lib/intake/normalize';
import {
  ALL_HERO_IDS,
  getTownHallReference,
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
  type HeroId,
} from '@/lib/game-data';
import { assessWarReadiness, recommendArmies, type WarGoal } from '@/lib/war';
import { getSeoGuide } from '@/lib/seo';

export interface CopilotTool<I = unknown> {
  readonly name: string;
  readonly description: string;
  // Input param is `unknown` so schemas with `.default()` (optional input,
  // required output) still assign cleanly.
  readonly inputSchema: z.ZodType<I, z.ZodTypeDef, unknown>;
  execute(input: I): unknown;
}

const GOALS = [
  'rate',
  'progress',
  'war',
  'trophy',
  'derush',
  'recruit',
] as const;
const WAR_GOALS = ['war', 'cwl', 'trophy', 'farming', 'legends'] as const;
const SUBSCORES: readonly SubScoreKey[] = [
  'heroes',
  'offense',
  'defense',
  'equipment',
  'progression',
  'walls',
  'clanValue',
];
const TH = z.number().int().min(MIN_TOWN_HALL).max(MAX_TOWN_HALL);
const HeroLevels = z.record(z.string(), z.number().min(0)).optional();

function heroLevelsTyped(
  raw: Record<string, number> | undefined,
): Partial<Record<HeroId, number>> {
  const out: Partial<Record<HeroId, number>> = {};
  for (const id of ALL_HERO_IDS) {
    if (raw && typeof raw[id] === 'number') out[id] = raw[id];
  }
  return out;
}

const explainWeight: CopilotTool<{ dimension: SubScoreKey; goal?: Goal }> = {
  name: 'explainWeight',
  description:
    'Explain how much a scoring dimension counts toward the CoachScore for a goal.',
  inputSchema: z
    .object({
      dimension: z.enum(SUBSCORES as [SubScoreKey, ...SubScoreKey[]]),
      goal: z.enum(GOALS).optional(),
    })
    .strict(),
  execute({ dimension, goal }) {
    const profile = selectWeightProfile(goal ?? 'rate', 16);
    return {
      dimension,
      goal: goal ?? 'rate',
      weightPct: Math.round((profile[dimension] ?? 0) * 100),
      note: 'Weights are goal-aware; Equipment is N/A below TH16 and its weight is redistributed.',
    };
  },
};

const compareTownHalls: CopilotTool<{ a: number; b: number }> = {
  name: 'compareTownHalls',
  description: 'Compare hero caps and wall levels between two Town Halls.',
  inputSchema: z.object({ a: TH, b: TH }).strict(),
  execute({ a, b }) {
    const row = (th: number) => {
      const ref = getTownHallReference(th);
      const heroes: Record<string, number> = {};
      for (const id of ALL_HERO_IDS) {
        if (ref.heroes[id].unlocked) heroes[id] = ref.heroes[id].maxLevel;
      }
      return {
        townHall: th,
        heroes,
        wallMax: ref.categories.walls.representativeMaxLevel,
      };
    };
    return { a: row(a), b: row(b) };
  },
};

const getGuide: CopilotTool<{ slug: string }> = {
  name: 'getGuide',
  description:
    'Fetch a CoachScore guide by slug (title, intro, key data points).',
  inputSchema: z.object({ slug: z.string().min(1).max(80) }).strict(),
  execute({ slug }) {
    const g = getSeoGuide(slug);
    if (!g) return { error: 'guide_not_found' };
    return {
      slug: g.slug,
      title: g.title,
      intro: g.intro.slice(0, 400),
      dataPoints: g.dataPoints.slice(0, 6),
    };
  },
};

const warInputSchema = z
  .object({
    townHall: TH,
    heroLevels: HeroLevels,
    labLevelPct: z.number().min(0).max(100).default(70),
    goal: z.enum(WAR_GOALS).default('war'),
  })
  .strict();
type WarToolInput = z.infer<typeof warInputSchema>;

const recommendArmy: CopilotTool<WarToolInput> = {
  name: 'recommendArmy',
  description:
    'Recommend meta armies the account can field, given TH, hero levels, lab development, and goal.',
  inputSchema: warInputSchema,
  execute(input) {
    return {
      armies: recommendArmies({
        townHall: input.townHall,
        heroLevels: heroLevelsTyped(input.heroLevels),
        labLevelPct: input.labLevelPct,
        goal: input.goal as WarGoal,
      }).map((a) => ({ name: a.name, fit: a.fit, ready: a.ready, why: a.why })),
    };
  },
};

const analyzeWarReadiness: CopilotTool<WarToolInput> = {
  name: 'analyzeWarReadiness',
  description: 'Assess war readiness (score, tier, missing requirements, ETA).',
  inputSchema: warInputSchema,
  execute(input) {
    const r = assessWarReadiness({
      townHall: input.townHall,
      heroLevels: heroLevelsTyped(input.heroLevels),
      labLevelPct: input.labLevelPct,
      goal: input.goal as WarGoal,
    });
    return {
      score: r.score,
      tier: r.tier,
      warTier: r.warTier,
      missingRequirements: r.missingRequirements,
      timeToReadyDays: r.timeToReadyDays,
    };
  },
};

const recommendUpgrade: CopilotTool<WarToolInput> = {
  name: 'recommendUpgrade',
  description:
    'Recommend the highest-impact upgrades next, for the stated goal.',
  inputSchema: warInputSchema,
  execute(input) {
    const r = assessWarReadiness({
      townHall: input.townHall,
      heroLevels: heroLevelsTyped(input.heroLevels),
      labLevelPct: input.labLevelPct,
      goal: input.goal as WarGoal,
    });
    return { priorities: r.upgradePriorities };
  },
};

const scoreInputSchema = z
  .object({
    townHall: TH,
    heroLevels: HeroLevels,
    offensePercent: z.number().min(0).max(100).default(60),
    defensePercent: z.number().min(0).max(100).default(60),
    progressionPercent: z.number().min(0).max(100).default(80),
    wallsAtMaxPercent: z.number().min(0).max(100).default(50),
    clanActivity: z.number().min(0).max(1).default(0.5),
    goal: z.enum(GOALS).default('rate'),
  })
  .strict();
type ScoreToolInput = z.infer<typeof scoreInputSchema>;

const getScoreBreakdown: CopilotTool<ScoreToolInput> = {
  name: 'getScoreBreakdown',
  description:
    'Compute the CoachScore breakdown (grade + sub-scores) for an account.',
  inputSchema: scoreInputSchema,
  execute(input) {
    const account = normalizeIntake({
      townHall: input.townHall,
      heroLevels: heroLevelsTyped(input.heroLevels),
      offensePercent: input.offensePercent,
      defensePercent: input.defensePercent,
      progressionPercent: input.progressionPercent,
      walls: { atOrAboveThMax: input.wallsAtMaxPercent, total: 100 },
      clan: {
        donationBehavior: input.clanActivity,
        warContribution: input.clanActivity,
        capitalContribution: input.clanActivity,
        activitySignal: input.clanActivity,
      },
    });
    const r = computeCoachScore(account, input.goal);
    return {
      grade: r.grade,
      overall: r.overallRounded,
      subScores: r.subScores,
      rushLabel: r.rushLabel,
    };
  },
};

export const COPILOT_TOOLS: readonly CopilotTool[] = [
  explainWeight,
  compareTownHalls,
  getGuide,
  recommendArmy,
  analyzeWarReadiness,
  recommendUpgrade,
  getScoreBreakdown,
] as CopilotTool[];

/** Validate + run a tool by name; returns `{ error }` on bad input/unknown tool. */
export function runTool(name: string, rawInput: unknown): unknown {
  const tool = COPILOT_TOOLS.find((t) => t.name === name);
  if (!tool) return { error: 'unknown_tool' };
  const parsed = tool.inputSchema.safeParse(rawInput);
  if (!parsed.success) return { error: 'invalid_input' };
  try {
    return tool.execute(parsed.data);
  } catch {
    return { error: 'tool_failed' };
  }
}
