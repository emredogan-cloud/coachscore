/**
 * Framework-agnostic intake handlers (Phase 3).
 *
 * Each handler validates a request body, runs the matching intake path, scores
 * the resulting account (the teaser value — works with no credentials), and
 * attempts persistence only when the database is activated. Dependencies
 * (activation checks, persist, AI provider, CoC adapter) are injectable, so the
 * handlers are fully unit-tested without a database, an API key, or a network.
 */

import { computeCoachScore } from '@/lib/core';
import type { CoachScoreResult, Goal } from '@/lib/core';
import { isAiConfigured, isDatabaseConfigured } from '@/lib/activation';
import { defaultProvider } from '@/lib/ai';
import type { AiProvider } from '@/lib/ai';
import {
  intakeByScreenshot,
  intakeByTag,
  intakeManual,
  ManualIntakeSchema,
  ScreenshotRequestSchema,
  TagIntakeSchema,
} from '@/lib/intake';
import type { CocApiAdapter, IntakeResult } from '@/lib/intake';
import { errorToResult, NotActivatedError, ValidationError } from './errors';
import { persistIntake, type PersistenceInfo } from './persist';

export interface HandlerResult {
  readonly status: number;
  readonly body: unknown;
}

export interface IntakeResponseBody {
  readonly ok: boolean;
  readonly source: string;
  readonly score: CoachScoreResult | null;
  readonly confidence: number;
  readonly fieldsNeedingConfirmation: readonly string[];
  readonly referenceReady: boolean;
  readonly snapshotHash: string | null;
  readonly persistence: PersistenceInfo;
}

/** Injectable seams; all default to the real, activation-aware implementations. */
export interface IntakeHandlerDeps {
  readonly isDbConfigured?: () => boolean;
  readonly persist?: (result: IntakeResult) => Promise<PersistenceInfo>;
  readonly isAiConfigured?: () => boolean;
  readonly provider?: AiProvider;
  readonly cocAdapter?: CocApiAdapter;
}

function buildBody(
  result: IntakeResult,
  goal: Goal,
  persistence: PersistenceInfo,
): IntakeResponseBody {
  return {
    ok: result.ok,
    source: result.source,
    score: result.account ? computeCoachScore(result.account, goal) : null,
    confidence: result.confidence,
    fieldsNeedingConfirmation: result.fieldsNeedingConfirmation,
    referenceReady: result.referenceReady,
    snapshotHash: result.snapshot?.snapshotHash ?? null,
    persistence,
  };
}

async function resolvePersistence(
  result: IntakeResult,
  deps: IntakeHandlerDeps,
): Promise<PersistenceInfo> {
  const dbConfigured = (deps.isDbConfigured ?? isDatabaseConfigured)();
  if (!dbConfigured) {
    return {
      attempted: false,
      persisted: false,
      reason: 'database_not_configured',
    };
  }
  return (deps.persist ?? persistIntake)(result);
}

function ok(
  result: IntakeResult,
  goal: Goal,
  persistence: PersistenceInfo,
): HandlerResult {
  return { status: 200, body: buildBody(result, goal, persistence) };
}

export async function handleManualIntake(
  rawBody: unknown,
  deps: IntakeHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = ManualIntakeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError(
        'Invalid manual intake body.',
        parsed.error.flatten(),
      ),
    );
  }
  const result = intakeManual({
    goal: parsed.data.goal,
    fields: parsed.data.fields,
  });
  if (!result.ok) {
    return errorToResult(new ValidationError(result.errors.join('; ')));
  }
  return ok(result, parsed.data.goal, await resolvePersistence(result, deps));
}

export async function handleTagIntake(
  rawBody: unknown,
  deps: IntakeHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = TagIntakeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError('Invalid tag intake body.', parsed.error.flatten()),
    );
  }
  const result = deps.cocAdapter
    ? await intakeByTag(parsed.data.playerTag, parsed.data.goal, {
        adapter: deps.cocAdapter,
      })
    : await intakeByTag(parsed.data.playerTag, parsed.data.goal);
  if (result.notActivated) {
    return errorToResult(
      new NotActivatedError(result.errors[0] ?? 'Tag intake is not activated.'),
    );
  }
  if (!result.ok) {
    return errorToResult(new ValidationError(result.errors.join('; ')));
  }
  return ok(result, parsed.data.goal, await resolvePersistence(result, deps));
}

export async function handleScreenshotIntake(
  rawBody: unknown,
  deps: IntakeHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = ScreenshotRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError(
        'Invalid screenshot intake body.',
        parsed.error.flatten(),
      ),
    );
  }
  if (!(deps.isAiConfigured ?? isAiConfigured)()) {
    return errorToResult(
      new NotActivatedError(
        'Screenshot OCR is not activated: set ANTHROPIC_API_KEY.',
      ),
    );
  }
  const provider = deps.provider ?? defaultProvider();
  const result = await intakeByScreenshot(
    {
      images: parsed.data.images,
      context: parsed.data.context,
      townHall: parsed.data.townHall,
      goal: parsed.data.goal,
      clan: parsed.data.clan,
      corrections: parsed.data.corrections,
    },
    { provider },
  );
  if (!result.ok) {
    return errorToResult(new ValidationError(result.errors.join('; ')));
  }
  return ok(result, parsed.data.goal, await resolvePersistence(result, deps));
}
