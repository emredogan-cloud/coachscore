/**
 * Marketplace API handlers (Phase 5) — coach application, coach rating, and
 * dispute creation. Each validates its body, gates on database activation, and
 * delegates to the MarketplaceService. Activation/service/identity are
 * injectable, so the handlers are unit-tested with in-memory repos and no DB.
 */

import { z } from 'zod';
import { isDatabaseConfigured } from '@/lib/activation';
import type { Identity } from '@/lib/auth';
import { SPECIALTIES } from '@/lib/coach';
import { MarketplaceError, type MarketplaceService } from '@/lib/marketplace';
import { errorToResult, NotActivatedError, ValidationError } from './errors';
import type { HandlerResult } from './intake-handler';
import { resolveIdentity, resolveMarketplaceService } from './marketplace-wire';

const CoachApplySchema = z.object({
  displayName: z.string().min(1).max(80),
  bio: z.string().min(1).max(4000),
  specialties: z.array(z.enum(SPECIALTIES)).min(1),
  motivation: z.string().min(1).max(4000),
  experience: z.string().min(1).max(4000),
  hourlyRateCents: z.number().int().min(0).optional(),
  weeklyCapacity: z.number().int().min(0).optional(),
});

const RateCoachSchema = z.object({
  coachId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  reportId: z.string().optional(),
});

const RaiseDisputeSchema = z.object({
  reportId: z.string().optional(),
  orderId: z.string().optional(),
  reason: z.string().min(10).max(2000),
});

export interface MarketplaceHandlerDeps {
  readonly isActivated?: () => boolean;
  readonly service?: MarketplaceService;
  readonly identity?: Identity;
}

async function gated(
  deps: MarketplaceHandlerDeps,
  run: (
    service: MarketplaceService,
    identity: Identity,
  ) => Promise<HandlerResult>,
): Promise<HandlerResult> {
  const activated = (deps.isActivated ?? isDatabaseConfigured)();
  if (!activated) {
    return errorToResult(
      new NotActivatedError(
        'Marketplace is not activated: set DATABASE_URL (+ Supabase Auth).',
      ),
    );
  }
  const service = deps.service ?? resolveMarketplaceService();
  const identity = deps.identity ?? resolveIdentity();
  try {
    return await run(service, identity);
  } catch (err) {
    if (err instanceof MarketplaceError) {
      return errorToResult(new ValidationError(err.message));
    }
    return errorToResult(err);
  }
}

export async function handleCoachApply(
  rawBody: unknown,
  deps: MarketplaceHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = CoachApplySchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError('Invalid coach application.', parsed.error.flatten()),
    );
  }
  return gated(deps, async (service, identity) => {
    const app = await service.applyAsCoach(identity, parsed.data);
    return { status: 200, body: { applicationId: app.id, status: app.status } };
  });
}

export async function handleRateCoach(
  rawBody: unknown,
  deps: MarketplaceHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = RateCoachSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError('Invalid rating.', parsed.error.flatten()),
    );
  }
  return gated(deps, async (service, identity) => {
    const rating = await service.rateCoach(identity, parsed.data);
    return { status: 200, body: { ratingId: rating.id } };
  });
}

export async function handleRaiseDispute(
  rawBody: unknown,
  deps: MarketplaceHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = RaiseDisputeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError('Invalid dispute.', parsed.error.flatten()),
    );
  }
  return gated(deps, async (service, identity) => {
    const dispute = await service.raiseDispute(identity, parsed.data);
    return {
      status: 200,
      body: { disputeId: dispute.id, status: dispute.status },
    };
  });
}
