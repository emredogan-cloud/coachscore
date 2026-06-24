/**
 * Growth handlers (Phase 7). Framework-agnostic, injectable, activation-gated.
 *
 * Analytics + experiment assignment work credential-free (a no-op forward sink +
 * deterministic bucketing); they persist only when the database is activated.
 * Referral writes and the growth dashboard require the database + a real
 * identity, so until Supabase Auth + Postgres are provisioned they report
 * `not_activated` — never a faked success. All seams are injected, so the logic
 * is unit-tested without a key, a network, or a database.
 */

import { z } from 'zod';
import { isDatabaseConfigured } from '@/lib/activation';
import type { Identity } from '@/lib/auth';
import { AuthorizationError, isElevated } from '@/lib/auth';
import {
  AnalyticsError,
  AnalyticsService,
  defaultAnalyticsProvider,
  type AnalyticsProvider,
} from '@/lib/analytics';
import type { Repositories } from '@/lib/db';
import { ExperimentService } from '@/lib/experiments';
import type { GrowthService } from '@/lib/growth';
import type { ReferralService } from '@/lib/referrals';
import { ReferralError } from '@/lib/referrals';
import { errorToResult, NotActivatedError, ValidationError } from './errors';
import type { HandlerResult } from './intake-handler';
import { resolveRepos } from './payment-wire';
import {
  resolveGrowthService,
  resolveGrowthIdentity,
  resolveReferralService,
} from './growth-wire';

const AUTH_NOT_ACTIVATED =
  'Accounts are not activated: Supabase Auth is not wired yet.';

const propertyValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const TrackEventSchema = z.object({
  name: z.string().min(1).max(80),
  properties: z.record(propertyValue).optional(),
  context: z
    .object({
      userId: z.string().nullable().optional(),
      anonId: z.string().nullable().optional(),
      source: z.enum(['web', 'server']).optional(),
    })
    .optional(),
});

export interface TrackEventDeps {
  readonly provider?: AnalyticsProvider;
  readonly repos?: Repositories;
  readonly isDbConfigured?: () => boolean;
}

function reposIfActivated(deps: {
  repos?: Repositories;
  isDbConfigured?: () => boolean;
}): Repositories | undefined {
  if (deps.repos) return deps.repos;
  return (deps.isDbConfigured ?? isDatabaseConfigured)()
    ? resolveRepos()
    : undefined;
}

export async function handleTrackEvent(
  rawBody: unknown,
  deps: TrackEventDeps = {},
): Promise<HandlerResult> {
  const parsed = TrackEventSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError('Invalid analytics event.', parsed.error.flatten()),
    );
  }
  const repos = reposIfActivated(deps);
  const service = new AnalyticsService({
    provider: deps.provider ?? defaultAnalyticsProvider(),
    repo: repos?.analyticsEvents,
  });
  try {
    const captured = await service.track(parsed.data);
    return {
      status: 200,
      body: { ok: true, event: captured.name, persisted: repos !== undefined },
    };
  } catch (err) {
    if (err instanceof AnalyticsError) {
      return errorToResult(new ValidationError(err.message));
    }
    return errorToResult(err);
  }
}

const AssignSchema = z.object({
  subjectId: z.string().min(1).max(200),
  experimentKey: z.string().min(1).max(80),
});

export interface AssignExperimentDeps {
  readonly provider?: AnalyticsProvider;
  readonly repos?: Repositories;
  readonly isDbConfigured?: () => boolean;
}

export async function handleAssignExperiment(
  rawBody: unknown,
  deps: AssignExperimentDeps = {},
): Promise<HandlerResult> {
  const parsed = AssignSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError(
        'Invalid assignment request.',
        parsed.error.flatten(),
      ),
    );
  }
  const repos = reposIfActivated(deps);
  const analytics = new AnalyticsService({
    provider: deps.provider ?? defaultAnalyticsProvider(),
    repo: repos?.analyticsEvents,
  });
  const service = new ExperimentService({
    repo: repos?.experimentAssignments,
    analytics,
  });
  try {
    const assignment = await service.assign(
      parsed.data.subjectId,
      parsed.data.experimentKey,
    );
    return { status: 200, body: { ok: true, ...assignment } };
  } catch (err) {
    return errorToResult(new ValidationError((err as Error).message));
  }
}

const FlagsSchema = z.object({ subjectId: z.string().min(1).max(200) });

export function handleGetFlags(rawQuery: unknown): HandlerResult {
  const parsed = FlagsSchema.safeParse(rawQuery);
  if (!parsed.success) {
    return errorToResult(new ValidationError('A subjectId is required.'));
  }
  const service = new ExperimentService();
  const flags = service.listFlags().map((f) => ({
    key: f.key,
    enabled: service.flag(f.key, parsed.data.subjectId),
  }));
  return { status: 200, body: { ok: true, flags } };
}

// --- Referrals (DB + auth gated) --------------------------------------------

export interface ReferralHandlerDeps {
  readonly isDbConfigured?: () => boolean;
  readonly service?: ReferralService;
  readonly identity?: Identity;
}

function gateAuthenticated(
  deps: ReferralHandlerDeps,
): { identity: Identity; service: ReferralService } | HandlerResult {
  if (!(deps.isDbConfigured ?? isDatabaseConfigured)()) {
    return errorToResult(
      new NotActivatedError('Referrals are not activated: set DATABASE_URL.'),
    );
  }
  const identity = deps.identity ?? resolveGrowthIdentity();
  if (identity.userId === null) {
    return errorToResult(new NotActivatedError(AUTH_NOT_ACTIVATED));
  }
  return { identity, service: deps.service ?? resolveReferralService() };
}

function isHandlerResult(value: unknown): value is HandlerResult {
  return typeof value === 'object' && value !== null && 'status' in value;
}

export async function handleCreateReferralCode(
  deps: ReferralHandlerDeps = {},
): Promise<HandlerResult> {
  const gate = gateAuthenticated(deps);
  if (isHandlerResult(gate)) return gate;
  try {
    const code = await gate.service.createCode(gate.identity);
    return { status: 200, body: { ok: true, code: code.code } };
  } catch (err) {
    return mapReferralError(err);
  }
}

const ClaimSchema = z.object({ code: z.string().min(1).max(20) });

export async function handleClaimReferral(
  rawBody: unknown,
  deps: ReferralHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = ClaimSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(new ValidationError('A referral code is required.'));
  }
  const gate = gateAuthenticated(deps);
  if (isHandlerResult(gate)) return gate;
  try {
    const referral = await gate.service.claim(gate.identity, parsed.data.code);
    return { status: 200, body: { ok: true, status: referral.status } };
  } catch (err) {
    return mapReferralError(err);
  }
}

export async function handleMyReferrals(
  deps: ReferralHandlerDeps = {},
): Promise<HandlerResult> {
  const gate = gateAuthenticated(deps);
  if (isHandlerResult(gate)) return gate;
  try {
    const mine = await gate.service.listMine(gate.identity);
    return {
      status: 200,
      body: { ok: true, code: mine.code?.code ?? null, stats: mine.stats },
    };
  } catch (err) {
    return mapReferralError(err);
  }
}

function mapReferralError(err: unknown): HandlerResult {
  if (err instanceof ReferralError || err instanceof AuthorizationError) {
    return errorToResult(new ValidationError((err as Error).message));
  }
  return errorToResult(err);
}

// --- Growth dashboard (DB + elevated-auth gated) ----------------------------

export interface GrowthDashboardDeps {
  readonly isDbConfigured?: () => boolean;
  readonly service?: GrowthService;
  readonly identity?: Identity;
}

export async function handleGrowthDashboard(
  deps: GrowthDashboardDeps = {},
): Promise<HandlerResult> {
  if (!(deps.isDbConfigured ?? isDatabaseConfigured)()) {
    return errorToResult(
      new NotActivatedError(
        'The growth dashboard is not activated: set DATABASE_URL.',
      ),
    );
  }
  const identity = deps.identity ?? resolveGrowthIdentity();
  if (!isElevated(identity)) {
    return errorToResult(new NotActivatedError(AUTH_NOT_ACTIVATED));
  }
  const service = deps.service ?? resolveGrowthService();
  const dashboard = await service.dashboard();
  return { status: 200, body: { ok: true, dashboard } };
}
