/**
 * Referral service (Phase 7). Creator-code referrals: a user gets one stable
 * code, others claim it (a pending referral), and a qualifying purchase converts
 * it (reward computed by the policy). Deny-by-default authz + audit + analytics;
 * depends only on the `Repositories` interface, so it is unit-tested with
 * in-memory repos. `qualify` is service-invoked (the purchase flow), not a user
 * action, so it carries no user permission check.
 */

import { assertCan } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import type { ReferralCodeRow, ReferralRow, Repositories } from '@/lib/db';
import type { AnalyticsService } from '@/lib/analytics';
import {
  generateReferralCode,
  isValidReferralCode,
  normalizeReferralCode,
} from './code';
import {
  computeReward,
  DEFAULT_REWARD_POLICY,
  type RewardPolicy,
} from './rewards';
import { referralStats, type ReferralStats } from './attribution';

export class ReferralError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferralError';
  }
}

export interface ReferralServiceDeps {
  readonly repos: Repositories;
  readonly analytics?: AnalyticsService;
  readonly rewardPolicy?: RewardPolicy;
  readonly now?: () => Date;
}

export interface QualifyInput {
  readonly refereeUserId: string;
  readonly orderId?: string;
  readonly orderAmountCents: number;
}

export interface MyReferrals {
  readonly code: ReferralCodeRow | null;
  readonly referrals: readonly ReferralRow[];
  readonly stats: ReferralStats;
}

export class ReferralService {
  private readonly repos: Repositories;
  private readonly analytics?: AnalyticsService;
  private readonly rewardPolicy: RewardPolicy;
  private readonly now: () => Date;
  constructor(deps: ReferralServiceDeps) {
    this.repos = deps.repos;
    this.analytics = deps.analytics;
    this.rewardPolicy = deps.rewardPolicy ?? DEFAULT_REWARD_POLICY;
    this.now = deps.now ?? (() => new Date());
  }

  private requireUser(identity: Identity): string {
    if (identity.userId === null) {
      throw new ReferralError('Authentication is required.');
    }
    return identity.userId;
  }

  /** Get-or-create the caller's stable referral code. */
  async createCode(identity: Identity): Promise<ReferralCodeRow> {
    assertCan(identity, 'referral:create');
    const userId = this.requireUser(identity);

    const existing = await this.repos.referralCodes.findByUser(userId);
    if (existing) return existing;

    let salt = 0;
    let code = generateReferralCode(userId);
    while ((await this.repos.referralCodes.findByCode(code)) !== null) {
      salt += 1;
      code = generateReferralCode(`${userId}:${salt}`);
    }
    const created = await this.repos.referralCodes.create({ userId, code });
    await this.analytics?.track({
      name: 'referral_code_created',
      properties: { code },
      context: { userId },
    });
    return created;
  }

  /** Claim someone else's code — records a pending referral for the caller. */
  async claim(identity: Identity, rawCode: string): Promise<ReferralRow> {
    assertCan(identity, 'referral:create');
    const refereeUserId = this.requireUser(identity);

    const code = normalizeReferralCode(rawCode);
    if (!isValidReferralCode(code)) {
      throw new ReferralError('Invalid referral code.');
    }
    const codeRow = await this.repos.referralCodes.findByCode(code);
    if (codeRow === null) {
      throw new ReferralError('Referral code not found.');
    }
    if (codeRow.userId === refereeUserId) {
      throw new ReferralError('You cannot claim your own referral code.');
    }
    const alreadyClaimed =
      await this.repos.referrals.findPendingByReferee(refereeUserId);
    if (alreadyClaimed) {
      throw new ReferralError('A referral is already pending for this user.');
    }

    const referral = await this.repos.referrals.create({
      codeId: codeRow.id,
      referrerUserId: codeRow.userId,
      refereeUserId,
      status: 'pending',
      rewardCents: 0,
    });
    await this.analytics?.track({
      name: 'referral_claimed',
      properties: { code },
      context: { userId: refereeUserId },
    });
    return referral;
  }

  /** Convert a referee's pending referral on a qualifying purchase (system call). */
  async qualify(input: QualifyInput): Promise<ReferralRow | null> {
    const pending = await this.repos.referrals.findPendingByReferee(
      input.refereeUserId,
    );
    if (pending === null) return null;

    const reward = computeReward(input.orderAmountCents, this.rewardPolicy);
    const updated = await this.repos.referrals.update(pending.id, {
      status: 'qualified',
      rewardCents: reward.referrerCents,
      attributedOrderId: input.orderId ?? null,
      qualifiedAt: this.now(),
    });
    await this.analytics?.track({
      name: 'referral_qualified',
      properties: { rewardCents: reward.referrerCents },
      context: { userId: pending.referrerUserId },
    });
    return updated;
  }

  /** The caller's own code + referrals + stats. */
  async listMine(identity: Identity): Promise<MyReferrals> {
    assertCan(identity, 'referral:read:own');
    const userId = this.requireUser(identity);
    const code = await this.repos.referralCodes.findByUser(userId);
    const referrals = await this.repos.referrals.listByReferrer(userId);
    return { code, referrals, stats: referralStats(referrals) };
  }
}
