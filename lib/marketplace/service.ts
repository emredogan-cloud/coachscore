/**
 * Marketplace service (Phase 5) — coach onboarding, the human-review workflow,
 * moderation, ratings, and disputes.
 *
 * Orchestrates the repositories with authorization (deny-by-default), the domain
 * state machines (illegal transitions throw), marketplace economics (60/40
 * split), audit logging, and queued notifications. Depends only on the
 * `Repositories` interface, so it is fully unit-tested with in-memory repos.
 */

import { assertCan, can } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import type { ReportDraft } from '@/lib/ai';
import {
  applicationMachine,
  coachStatusMachine,
  summarizeRatings,
  validateCoachProfile,
  type CoachProfileInput,
  type CoachStatus,
} from '@/lib/coach';
import { moderationMachine, reviewMachine } from '@/lib/review';
import { disputeMachine, type DisputeStatus } from '@/lib/disputes';
import { computeSplit } from '@/lib/economics';
import type {
  Coach,
  CoachApplication,
  CoachRating,
  Dispute,
  Moderation,
  Payout,
  Repositories,
  ReviewAssignment,
} from '@/lib/db';

export class MarketplaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketplaceError';
  }
}

function orThrow<T>(value: T | null, message: string): T {
  if (value === null) throw new MarketplaceError(message);
  return value;
}

type RatingModeration = CoachRating['moderation'];

export interface CoachApplicationInput extends CoachProfileInput {
  readonly motivation: string;
  readonly experience: string;
}

export class MarketplaceService {
  constructor(
    private readonly repos: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private requireUser(identity: Identity): string {
    if (identity.userId === null) {
      throw new MarketplaceError('Authentication required.');
    }
    return identity.userId;
  }

  private notify(
    userId: string | null,
    kind:
      | 'assignment'
      | 'review_completion'
      | 'escalation'
      | 'payout'
      | 'dispute',
    title: string,
    body: string,
  ): Promise<unknown> {
    return this.repos.notifications.create({ userId, kind, title, body });
  }

  private audit(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ): Promise<unknown> {
    return this.repos.auditLogs.create({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata: metadata ?? null,
    });
  }

  private async getAssignment(id: string): Promise<ReviewAssignment> {
    return orThrow(
      await this.repos.reviewAssignments.findById(id),
      'Review assignment not found.',
    );
  }

  private async updateAssignment(
    id: string,
    patch: Partial<ReviewAssignment>,
  ): Promise<ReviewAssignment> {
    return orThrow(
      await this.repos.reviewAssignments.update(id, patch),
      'Review assignment not found.',
    );
  }

  private async requireCoach(identity: Identity): Promise<Coach> {
    const userId = this.requireUser(identity);
    return orThrow(
      await this.repos.coaches.findByUserId(userId),
      'No coach profile for this user.',
    );
  }

  // --- Coach onboarding -----------------------------------------------------

  async applyAsCoach(
    identity: Identity,
    input: CoachApplicationInput,
  ): Promise<CoachApplication> {
    const userId = this.requireUser(identity);
    const profile = validateCoachProfile(input);
    if (!profile.ok) {
      throw new MarketplaceError(
        `Invalid application: ${profile.errors.join('; ')}`,
      );
    }
    if (
      input.motivation.trim().length < 20 ||
      input.experience.trim().length < 20
    ) {
      throw new MarketplaceError(
        'Motivation and experience must each be at least 20 characters.',
      );
    }
    const application = await this.repos.coachApplications.create({
      userId,
      status: 'pending',
      displayName: profile.value.displayName,
      bio: profile.value.bio,
      specialties: [...profile.value.specialties],
      motivation: input.motivation.trim(),
      experience: input.experience.trim(),
    });
    await this.audit(
      userId,
      'coach.applied',
      'coach_application',
      application.id,
    );
    return application;
  }

  async approveApplication(
    identity: Identity,
    applicationId: string,
  ): Promise<Coach> {
    assertCan(identity, 'admin:manage');
    const app = orThrow(
      await this.repos.coachApplications.findById(applicationId),
      'Application not found.',
    );
    applicationMachine.assert(app.status, 'approved');
    await this.repos.coachApplications.update(app.id, {
      status: 'approved',
      reviewedByUserId: identity.userId,
    });
    const coach = await this.repos.coaches.create({
      userId: app.userId,
      displayName: app.displayName,
      bio: app.bio,
      status: 'approved',
      specialties: app.specialties,
    });
    await this.audit(identity.userId, 'coach.approved', 'coach', coach.id, {
      applicationId,
    });
    await this.notify(
      app.userId,
      'assignment',
      'You are approved as a coach',
      'Welcome aboard — activate your profile to start reviewing reports.',
    );
    return coach;
  }

  async rejectApplication(
    identity: Identity,
    applicationId: string,
    notes?: string,
  ): Promise<CoachApplication> {
    assertCan(identity, 'admin:manage');
    const app = orThrow(
      await this.repos.coachApplications.findById(applicationId),
      'Application not found.',
    );
    applicationMachine.assert(app.status, 'rejected');
    const updated = orThrow(
      await this.repos.coachApplications.update(app.id, {
        status: 'rejected',
        reviewedByUserId: identity.userId,
        reviewNotes: notes ?? null,
      }),
      'Application not found.',
    );
    await this.audit(
      identity.userId,
      'coach.rejected',
      'coach_application',
      app.id,
    );
    return updated;
  }

  async activateCoach(identity: Identity, coachId: string): Promise<Coach> {
    const coach = orThrow(
      await this.repos.coaches.findById(coachId),
      'Coach not found.',
    );
    if (identity.userId !== coach.userId && !can(identity, 'admin:manage')) {
      throw new MarketplaceError('Not authorized to activate this coach.');
    }
    coachStatusMachine.assert(coach.status, 'active');
    const updated = orThrow(
      await this.repos.coaches.update(coachId, { status: 'active' }),
      'Coach not found.',
    );
    await this.audit(identity.userId, 'coach.activated', 'coach', coachId);
    return updated;
  }

  async setCoachStatus(
    identity: Identity,
    coachId: string,
    status: CoachStatus,
  ): Promise<Coach> {
    assertCan(identity, 'admin:manage');
    const coach = orThrow(
      await this.repos.coaches.findById(coachId),
      'Coach not found.',
    );
    coachStatusMachine.assert(coach.status, status);
    const updated = orThrow(
      await this.repos.coaches.update(coachId, { status }),
      'Coach not found.',
    );
    await this.audit(
      identity.userId,
      'coach.status_changed',
      'coach',
      coachId,
      {
        status,
      },
    );
    return updated;
  }

  // --- Review workflow ------------------------------------------------------

  async createReviewAssignment(
    identity: Identity,
    input: { reportId: string; reportDraftId?: string | null },
  ): Promise<ReviewAssignment> {
    assertCan(identity, 'admin:manage');
    const assignment = await this.repos.reviewAssignments.create({
      reportId: input.reportId,
      reportDraftId: input.reportDraftId ?? null,
      status: 'unassigned',
    });
    await this.audit(
      identity.userId,
      'review.created',
      'review_assignment',
      assignment.id,
    );
    return assignment;
  }

  async assignReview(
    identity: Identity,
    assignmentId: string,
    coachId: string,
  ): Promise<ReviewAssignment> {
    assertCan(identity, 'admin:manage');
    const ra = await this.getAssignment(assignmentId);
    reviewMachine.assert(ra.status, 'assigned');
    const updated = await this.updateAssignment(ra.id, {
      status: 'assigned',
      coachId,
    });
    const coach = await this.repos.coaches.findById(coachId);
    await this.notify(
      coach?.userId ?? null,
      'assignment',
      'New review assigned',
      'A report is waiting for your review.',
    );
    await this.audit(
      identity.userId,
      'review.assigned',
      'review_assignment',
      ra.id,
      { coachId },
    );
    return updated;
  }

  async claimReview(
    identity: Identity,
    assignmentId: string,
  ): Promise<ReviewAssignment> {
    assertCan(identity, 'report:review');
    const coach = await this.requireCoach(identity);
    const ra = await this.getAssignment(assignmentId);
    reviewMachine.assert(ra.status, 'claimed');
    const updated = await this.updateAssignment(ra.id, {
      status: 'claimed',
      coachId: coach.id,
      claimedAt: this.clock(),
    });
    await this.audit(
      identity.userId,
      'review.claimed',
      'review_assignment',
      ra.id,
    );
    return updated;
  }

  async releaseReview(
    identity: Identity,
    assignmentId: string,
  ): Promise<ReviewAssignment> {
    assertCan(identity, 'report:review');
    const ra = await this.getAssignment(assignmentId);
    reviewMachine.assert(ra.status, 'unassigned');
    const updated = await this.updateAssignment(ra.id, {
      status: 'unassigned',
      coachId: null,
    });
    await this.audit(
      identity.userId,
      'review.released',
      'review_assignment',
      ra.id,
    );
    return updated;
  }

  async startReview(
    identity: Identity,
    assignmentId: string,
  ): Promise<ReviewAssignment> {
    assertCan(identity, 'report:review');
    const ra = await this.getAssignment(assignmentId);
    reviewMachine.assert(ra.status, 'in_review');
    return this.updateAssignment(ra.id, { status: 'in_review' });
  }

  async submitReview(
    identity: Identity,
    assignmentId: string,
    input: { editedDraft?: ReportDraft | null; notes?: string },
  ): Promise<{ assignment: ReviewAssignment; moderation: Moderation }> {
    assertCan(identity, 'report:review');
    const ra = await this.getAssignment(assignmentId);
    reviewMachine.assert(ra.status, 'submitted');
    const assignment = await this.updateAssignment(ra.id, {
      status: 'submitted',
      editedDraft: input.editedDraft ?? null,
      notes: input.notes ?? null,
      submittedAt: this.clock(),
    });
    const moderation = await this.repos.moderations.create({
      reviewAssignmentId: ra.id,
      status: 'pending',
    });
    await this.audit(
      identity.userId,
      'review.submitted',
      'review_assignment',
      ra.id,
    );
    return { assignment, moderation };
  }

  async escalateReview(
    identity: Identity,
    assignmentId: string,
  ): Promise<ReviewAssignment> {
    assertCan(identity, 'report:review');
    const ra = await this.getAssignment(assignmentId);
    reviewMachine.assert(ra.status, 'escalated');
    const updated = await this.updateAssignment(ra.id, { status: 'escalated' });
    await this.notify(
      null,
      'escalation',
      'Review escalated',
      `Review ${ra.id} needs admin attention.`,
    );
    await this.audit(
      identity.userId,
      'review.escalated',
      'review_assignment',
      ra.id,
    );
    return updated;
  }

  // --- Moderation -----------------------------------------------------------

  async moderateApprove(
    identity: Identity,
    moderationId: string,
    input: { grossCents: number },
  ): Promise<{ moderation: Moderation; payout: Payout | null }> {
    assertCan(identity, 'admin:manage');
    const mod = orThrow(
      await this.repos.moderations.findById(moderationId),
      'Moderation not found.',
    );
    moderationMachine.assert(mod.status, 'approved');
    const ra = await this.getAssignment(mod.reviewAssignmentId);
    reviewMachine.assert(ra.status, 'approved');

    const moderation = orThrow(
      await this.repos.moderations.update(mod.id, {
        status: 'approved',
        moderatorUserId: identity.userId,
      }),
      'Moderation not found.',
    );
    await this.updateAssignment(ra.id, { status: 'approved' });
    await this.repos.reports.updateStatus(ra.reportId, { status: 'approved' });

    let payout: Payout | null = null;
    if (ra.coachId !== null) {
      const split = computeSplit(input.grossCents);
      payout = await this.repos.payouts.create({
        coachId: ra.coachId,
        reviewAssignmentId: ra.id,
        amountCents: split.coachCents,
        currency: 'usd',
        status: 'pending',
      });
      const coach = await this.repos.coaches.findById(ra.coachId);
      await this.notify(
        coach?.userId ?? null,
        'payout',
        'Review approved — payout pending',
        `You earned ${split.coachCents} cents from this review (payout pending).`,
      );
    }
    await this.audit(
      identity.userId,
      'moderation.approved',
      'moderation',
      mod.id,
      { coachCents: payout?.amountCents ?? 0 },
    );
    return { moderation, payout };
  }

  async moderateRequestRevision(
    identity: Identity,
    moderationId: string,
    notes?: string,
  ): Promise<Moderation> {
    assertCan(identity, 'admin:manage');
    const mod = orThrow(
      await this.repos.moderations.findById(moderationId),
      'Moderation not found.',
    );
    moderationMachine.assert(mod.status, 'revision_requested');
    const ra = await this.getAssignment(mod.reviewAssignmentId);
    reviewMachine.assert(ra.status, 'in_review');
    const moderation = orThrow(
      await this.repos.moderations.update(mod.id, {
        status: 'revision_requested',
        moderatorUserId: identity.userId,
        notes: notes ?? null,
      }),
      'Moderation not found.',
    );
    await this.updateAssignment(ra.id, { status: 'in_review' });
    const coach = ra.coachId
      ? await this.repos.coaches.findById(ra.coachId)
      : null;
    await this.notify(
      coach?.userId ?? null,
      'review_completion',
      'Revision requested',
      notes ?? 'A moderator requested changes to your review.',
    );
    return moderation;
  }

  async moderateReject(
    identity: Identity,
    moderationId: string,
    notes?: string,
  ): Promise<Moderation> {
    assertCan(identity, 'admin:manage');
    const mod = orThrow(
      await this.repos.moderations.findById(moderationId),
      'Moderation not found.',
    );
    moderationMachine.assert(mod.status, 'rejected');
    const ra = await this.getAssignment(mod.reviewAssignmentId);
    reviewMachine.assert(ra.status, 'rejected');
    const moderation = orThrow(
      await this.repos.moderations.update(mod.id, {
        status: 'rejected',
        moderatorUserId: identity.userId,
        notes: notes ?? null,
      }),
      'Moderation not found.',
    );
    await this.updateAssignment(ra.id, { status: 'rejected' });
    await this.repos.reports.updateStatus(ra.reportId, { status: 'failed' });
    await this.audit(
      identity.userId,
      'moderation.rejected',
      'moderation',
      mod.id,
    );
    return moderation;
  }

  // --- Ratings --------------------------------------------------------------

  private async recomputeReputation(coachId: string): Promise<void> {
    const all = await this.repos.coachRatings.listByCoach(coachId);
    const visible = all.filter((r) => r.moderation === 'visible');
    const summary = summarizeRatings(visible.map((r) => r.stars));
    await this.repos.coaches.update(coachId, {
      ratingAverage: summary.average,
      ratingCount: summary.count,
      reputationScore: summary.reputationScore,
    });
  }

  async rateCoach(
    identity: Identity,
    input: {
      coachId: string;
      stars: number;
      comment?: string;
      reportId?: string | null;
    },
  ): Promise<CoachRating> {
    const userId = this.requireUser(identity);
    if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
      throw new MarketplaceError('stars must be an integer 1–5.');
    }
    orThrow(
      await this.repos.coaches.findById(input.coachId),
      'Coach not found.',
    );
    const rating = await this.repos.coachRatings.create({
      coachId: input.coachId,
      reportId: input.reportId ?? null,
      raterUserId: userId,
      stars: input.stars,
      comment: input.comment ?? null,
    });
    await this.recomputeReputation(input.coachId);
    await this.audit(userId, 'coach.rated', 'coach', input.coachId, {
      stars: input.stars,
    });
    return rating;
  }

  async moderateRating(
    identity: Identity,
    ratingId: string,
    moderation: RatingModeration,
  ): Promise<CoachRating> {
    assertCan(identity, 'admin:manage');
    const rating = orThrow(
      await this.repos.coachRatings.update(ratingId, { moderation }),
      'Rating not found.',
    );
    await this.recomputeReputation(rating.coachId);
    await this.audit(
      identity.userId,
      'rating.moderated',
      'coach_rating',
      ratingId,
      {
        moderation,
      },
    );
    return rating;
  }

  // --- Disputes -------------------------------------------------------------

  async raiseDispute(
    identity: Identity,
    input: {
      reportId?: string | null;
      orderId?: string | null;
      reason: string;
    },
  ): Promise<Dispute> {
    const userId = this.requireUser(identity);
    if (input.reason.trim().length < 10) {
      throw new MarketplaceError(
        'Dispute reason must be at least 10 characters.',
      );
    }
    const dispute = await this.repos.disputes.create({
      reportId: input.reportId ?? null,
      orderId: input.orderId ?? null,
      raisedByUserId: userId,
      status: 'open',
      reason: input.reason.trim(),
    });
    await this.audit(userId, 'dispute.raised', 'dispute', dispute.id);
    return dispute;
  }

  async resolveDispute(
    identity: Identity,
    disputeId: string,
    status: DisputeStatus,
    notes?: string,
  ): Promise<Dispute> {
    assertCan(identity, 'admin:manage');
    const dispute = orThrow(
      await this.repos.disputes.findById(disputeId),
      'Dispute not found.',
    );
    disputeMachine.assert(dispute.status, status);
    const updated = orThrow(
      await this.repos.disputes.update(disputeId, {
        status,
        resolutionNotes: notes ?? null,
      }),
      'Dispute not found.',
    );
    await this.audit(
      identity.userId,
      'dispute.resolved',
      'dispute',
      disputeId,
      {
        status,
      },
    );
    return updated;
  }
}
