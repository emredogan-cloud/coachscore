/**
 * In-memory repositories (Phase 3) — the dev/test persistence implementation.
 *
 * Deterministic when given a counter `idGen` + fixed `now` (tests do this), so
 * the full service layer is unit-tested without a database. Production uses the
 * Drizzle implementation (`./drizzle`) behind the same interfaces.
 */

import { randomUUID } from 'node:crypto';
import type {
  Account,
  AccountSnapshotRow,
  AuditLog,
  Job,
  NewAccount,
  NewAccountSnapshotRow,
  NewAuditLog,
  NewJob,
  NewReport,
  NewReportDraftRow,
  NewUpload,
  NewUser,
  Report,
  ReportDraftRow,
  Upload,
  User,
  Order,
  NewOrder,
  Entitlement,
  NewEntitlement,
  EmailDelivery,
  NewEmailDelivery,
  Coach,
  NewCoach,
  CoachApplication,
  NewCoachApplication,
  ReviewAssignment,
  NewReviewAssignment,
  Moderation,
  NewModeration,
  CoachRating,
  NewCoachRating,
  PayoutAccount,
  NewPayoutAccount,
  Payout,
  NewPayout,
  Dispute,
  NewDispute,
  Notification,
  NewNotification,
} from '../schema';
import type {
  AccountRepository,
  AuditLogRepository,
  CoachApplicationRepository,
  CoachRatingRepository,
  CoachRepository,
  DisputeRepository,
  EmailDeliveryRepository,
  EntitlementRepository,
  JobRepository,
  ModerationRepository,
  NotificationRepository,
  OrderRepository,
  PayoutAccountRepository,
  PayoutRepository,
  Repositories,
  RepoDeps,
  ReportDraftRepository,
  ReportRepository,
  ReviewAssignmentRepository,
  SnapshotRepository,
  UploadRepository,
  UserRepository,
} from './types';

class MemTable<Row extends { id: string }> {
  private readonly rows = new Map<string, Row>();
  insert(row: Row): Row {
    this.rows.set(row.id, row);
    return row;
  }
  byId(id: string): Row | null {
    return this.rows.get(id) ?? null;
  }
  all(): Row[] {
    return [...this.rows.values()];
  }
}

class MemUserRepository implements UserRepository {
  private readonly t = new MemTable<User>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewUser): Promise<User> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      email: input.email,
      displayName: input.displayName ?? null,
      role: input.role ?? 'user',
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<User | null> {
    return this.t.byId(id);
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.t.all().find((u) => u.email === email) ?? null;
  }
}

class MemAccountRepository implements AccountRepository {
  private readonly t = new MemTable<Account>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewAccount): Promise<Account> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      userId: input.userId,
      playerTag: input.playerTag ?? null,
      townHall: input.townHall,
      source: input.source,
      label: input.label ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<Account | null> {
    return this.t.byId(id);
  }
  async listByUser(userId: string): Promise<Account[]> {
    return this.t.all().filter((a) => a.userId === userId);
  }
}

class MemSnapshotRepository implements SnapshotRepository {
  private readonly t = new MemTable<AccountSnapshotRow>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewAccountSnapshotRow): Promise<AccountSnapshotRow> {
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      accountId: input.accountId,
      snapshotHash: input.snapshotHash,
      goal: input.goal,
      townHall: input.townHall,
      normalizedAccount: input.normalizedAccount,
      provenance: input.provenance,
      engineVersion: input.engineVersion,
      referenceTableVersion: input.referenceTableVersion,
      knowledgeBaseVersion: input.knowledgeBaseVersion,
      createdAt: input.createdAt ?? this.deps.now(),
    });
  }
  async findById(id: string): Promise<AccountSnapshotRow | null> {
    return this.t.byId(id);
  }
  async findByHash(
    accountId: string,
    snapshotHash: string,
  ): Promise<AccountSnapshotRow | null> {
    return (
      this.t
        .all()
        .find(
          (s) => s.accountId === accountId && s.snapshotHash === snapshotHash,
        ) ?? null
    );
  }
}

class MemReportRepository implements ReportRepository {
  private readonly t = new MemTable<Report>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewReport): Promise<Report> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      accountId: input.accountId,
      snapshotId: input.snapshotId,
      goal: input.goal,
      tier: input.tier,
      status: input.status ?? 'pending',
      overall: input.overall ?? null,
      grade: input.grade ?? null,
      paid: input.paid ?? false,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<Report | null> {
    return this.t.byId(id);
  }
  async listByAccount(accountId: string): Promise<Report[]> {
    return this.t.all().filter((r) => r.accountId === accountId);
  }
  async updateStatus(
    id: string,
    patch: Partial<Pick<Report, 'status' | 'overall' | 'grade' | 'paid'>>,
  ): Promise<Report | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemReportDraftRepository implements ReportDraftRepository {
  private readonly t = new MemTable<ReportDraftRow>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewReportDraftRow): Promise<ReportDraftRow> {
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      reportId: input.reportId,
      snapshotId: input.snapshotId,
      draft: input.draft ?? null,
      confidence: input.confidence,
      needsHumanReview: input.needsHumanReview,
      flags: input.flags,
      attempts: input.attempts,
      referenceReady: input.referenceReady,
      usage: input.usage ?? null,
      createdAt: input.createdAt ?? this.deps.now(),
    });
  }
  async listByReport(reportId: string): Promise<ReportDraftRow[]> {
    return this.t.all().filter((d) => d.reportId === reportId);
  }
}

class MemUploadRepository implements UploadRepository {
  private readonly t = new MemTable<Upload>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewUpload): Promise<Upload> {
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      userId: input.userId ?? null,
      accountId: input.accountId ?? null,
      kind: input.kind,
      storageKey: input.storageKey,
      contentType: input.contentType,
      byteSize: input.byteSize,
      status: input.status ?? 'pending',
      createdAt: input.createdAt ?? this.deps.now(),
    });
  }
  async findById(id: string): Promise<Upload | null> {
    return this.t.byId(id);
  }
  async updateStatus(
    id: string,
    status: Upload['status'],
  ): Promise<Upload | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, status });
  }
}

class MemJobRepository implements JobRepository {
  private readonly t = new MemTable<Job>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewJob): Promise<Job> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      idempotencyKey: input.idempotencyKey,
      kind: input.kind,
      status: input.status ?? 'pending',
      attempts: input.attempts ?? 0,
      payload: input.payload,
      result: input.result ?? null,
      error: input.error ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findByIdempotencyKey(key: string): Promise<Job | null> {
    return this.t.all().find((j) => j.idempotencyKey === key) ?? null;
  }
  async update(
    id: string,
    patch: Partial<Pick<Job, 'status' | 'attempts' | 'result' | 'error'>>,
  ): Promise<Job | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemAuditLogRepository implements AuditLogRepository {
  private readonly t = new MemTable<AuditLog>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewAuditLog): Promise<AuditLog> {
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
      createdAt: input.createdAt ?? this.deps.now(),
    });
  }
  async listByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.t
      .all()
      .filter((a) => a.entityType === entityType && a.entityId === entityId);
  }
}

class MemOrderRepository implements OrderRepository {
  private readonly t = new MemTable<Order>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewOrder): Promise<Order> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      userId: input.userId ?? null,
      reportId: input.reportId ?? null,
      tier: input.tier,
      quantity: input.quantity ?? 1,
      amountCents: input.amountCents,
      currency: input.currency ?? 'usd',
      status: input.status ?? 'pending',
      stripeSessionId: input.stripeSessionId ?? null,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<Order | null> {
    return this.t.byId(id);
  }
  async findByStripeSessionId(sessionId: string): Promise<Order | null> {
    return this.t.all().find((o) => o.stripeSessionId === sessionId) ?? null;
  }
  async listByUser(userId: string): Promise<Order[]> {
    return this.t.all().filter((o) => o.userId === userId);
  }
  async update(
    id: string,
    patch: Partial<
      Pick<Order, 'status' | 'stripeSessionId' | 'stripePaymentIntentId'>
    >,
  ): Promise<Order | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemEntitlementRepository implements EntitlementRepository {
  private readonly t = new MemTable<Entitlement>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewEntitlement): Promise<Entitlement> {
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      userId: input.userId ?? null,
      sku: input.sku,
      reportId: input.reportId ?? null,
      orderId: input.orderId ?? null,
      source: input.source,
      createdAt: input.createdAt ?? this.deps.now(),
    });
  }
  async listByUser(userId: string): Promise<Entitlement[]> {
    return this.t.all().filter((e) => e.userId === userId);
  }
  async findForReport(
    userId: string,
    reportId: string,
  ): Promise<Entitlement | null> {
    return (
      this.t
        .all()
        .find((e) => e.userId === userId && e.reportId === reportId) ?? null
    );
  }
}

class MemEmailDeliveryRepository implements EmailDeliveryRepository {
  private readonly t = new MemTable<EmailDelivery>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewEmailDelivery): Promise<EmailDelivery> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      toEmail: input.toEmail,
      template: input.template,
      status: input.status ?? 'queued',
      relatedReportId: input.relatedReportId ?? null,
      providerId: input.providerId ?? null,
      error: input.error ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<EmailDelivery | null> {
    return this.t.byId(id);
  }
  async update(
    id: string,
    patch: Partial<Pick<EmailDelivery, 'status' | 'providerId' | 'error'>>,
  ): Promise<EmailDelivery | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemCoachRepository implements CoachRepository {
  private readonly t = new MemTable<Coach>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewCoach): Promise<Coach> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      userId: input.userId,
      displayName: input.displayName,
      bio: input.bio,
      status: input.status ?? 'applied',
      specialties: input.specialties,
      hourlyRateCents: input.hourlyRateCents ?? null,
      acceptingWork: input.acceptingWork ?? true,
      weeklyCapacity: input.weeklyCapacity ?? 10,
      ratingAverage: input.ratingAverage ?? 0,
      ratingCount: input.ratingCount ?? 0,
      reputationScore: input.reputationScore ?? 0,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<Coach | null> {
    return this.t.byId(id);
  }
  async findByUserId(userId: string): Promise<Coach | null> {
    return this.t.all().find((c) => c.userId === userId) ?? null;
  }
  async listByStatus(status: Coach['status']): Promise<Coach[]> {
    return this.t.all().filter((c) => c.status === status);
  }
  async listActive(): Promise<Coach[]> {
    return this.t.all().filter((c) => c.status === 'active');
  }
  async update(id: string, patch: Partial<Coach>): Promise<Coach | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemCoachApplicationRepository implements CoachApplicationRepository {
  private readonly t = new MemTable<CoachApplication>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewCoachApplication): Promise<CoachApplication> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      userId: input.userId,
      status: input.status ?? 'pending',
      displayName: input.displayName,
      bio: input.bio,
      specialties: input.specialties,
      motivation: input.motivation,
      experience: input.experience,
      reviewedByUserId: input.reviewedByUserId ?? null,
      reviewNotes: input.reviewNotes ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<CoachApplication | null> {
    return this.t.byId(id);
  }
  async listByStatus(
    status: CoachApplication['status'],
  ): Promise<CoachApplication[]> {
    return this.t.all().filter((a) => a.status === status);
  }
  async update(
    id: string,
    patch: Partial<CoachApplication>,
  ): Promise<CoachApplication | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemReviewAssignmentRepository implements ReviewAssignmentRepository {
  private readonly t = new MemTable<ReviewAssignment>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewReviewAssignment): Promise<ReviewAssignment> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      reportId: input.reportId,
      reportDraftId: input.reportDraftId ?? null,
      coachId: input.coachId ?? null,
      status: input.status ?? 'unassigned',
      editedDraft: input.editedDraft ?? null,
      notes: input.notes ?? null,
      claimedAt: input.claimedAt ?? null,
      submittedAt: input.submittedAt ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<ReviewAssignment | null> {
    return this.t.byId(id);
  }
  async listByStatus(
    status: ReviewAssignment['status'],
  ): Promise<ReviewAssignment[]> {
    return this.t.all().filter((r) => r.status === status);
  }
  async listByCoach(coachId: string): Promise<ReviewAssignment[]> {
    return this.t.all().filter((r) => r.coachId === coachId);
  }
  async update(
    id: string,
    patch: Partial<ReviewAssignment>,
  ): Promise<ReviewAssignment | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemModerationRepository implements ModerationRepository {
  private readonly t = new MemTable<Moderation>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewModeration): Promise<Moderation> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      reviewAssignmentId: input.reviewAssignmentId,
      status: input.status ?? 'pending',
      moderatorUserId: input.moderatorUserId ?? null,
      notes: input.notes ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<Moderation | null> {
    return this.t.byId(id);
  }
  async findByAssignment(
    reviewAssignmentId: string,
  ): Promise<Moderation | null> {
    return (
      this.t.all().find((m) => m.reviewAssignmentId === reviewAssignmentId) ??
      null
    );
  }
  async update(
    id: string,
    patch: Partial<Moderation>,
  ): Promise<Moderation | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemCoachRatingRepository implements CoachRatingRepository {
  private readonly t = new MemTable<CoachRating>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewCoachRating): Promise<CoachRating> {
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      coachId: input.coachId,
      reportId: input.reportId ?? null,
      raterUserId: input.raterUserId ?? null,
      stars: input.stars,
      comment: input.comment ?? null,
      moderation: input.moderation ?? 'visible',
      createdAt: input.createdAt ?? this.deps.now(),
    });
  }
  async listByCoach(coachId: string): Promise<CoachRating[]> {
    return this.t.all().filter((r) => r.coachId === coachId);
  }
  async update(
    id: string,
    patch: Partial<CoachRating>,
  ): Promise<CoachRating | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch });
  }
}

class MemPayoutAccountRepository implements PayoutAccountRepository {
  private readonly t = new MemTable<PayoutAccount>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewPayoutAccount): Promise<PayoutAccount> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      coachId: input.coachId,
      provider: input.provider ?? 'stripe_connect',
      externalAccountId: input.externalAccountId ?? null,
      status: input.status ?? 'pending',
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findByCoach(coachId: string): Promise<PayoutAccount | null> {
    return this.t.all().find((p) => p.coachId === coachId) ?? null;
  }
  async update(
    id: string,
    patch: Partial<PayoutAccount>,
  ): Promise<PayoutAccount | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemPayoutRepository implements PayoutRepository {
  private readonly t = new MemTable<Payout>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewPayout): Promise<Payout> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      coachId: input.coachId,
      reviewAssignmentId: input.reviewAssignmentId ?? null,
      amountCents: input.amountCents,
      currency: input.currency ?? 'usd',
      status: input.status ?? 'pending',
      externalPayoutId: input.externalPayoutId ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<Payout | null> {
    return this.t.byId(id);
  }
  async listByCoach(coachId: string): Promise<Payout[]> {
    return this.t.all().filter((p) => p.coachId === coachId);
  }
  async update(id: string, patch: Partial<Payout>): Promise<Payout | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemDisputeRepository implements DisputeRepository {
  private readonly t = new MemTable<Dispute>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewDispute): Promise<Dispute> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      reportId: input.reportId ?? null,
      orderId: input.orderId ?? null,
      raisedByUserId: input.raisedByUserId ?? null,
      status: input.status ?? 'open',
      reason: input.reason,
      resolutionNotes: input.resolutionNotes ?? null,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async findById(id: string): Promise<Dispute | null> {
    return this.t.byId(id);
  }
  async listByStatus(status: Dispute['status']): Promise<Dispute[]> {
    return this.t.all().filter((d) => d.status === status);
  }
  async update(id: string, patch: Partial<Dispute>): Promise<Dispute | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

class MemNotificationRepository implements NotificationRepository {
  private readonly t = new MemTable<Notification>();
  constructor(private readonly deps: RepoDeps) {}
  async create(input: NewNotification): Promise<Notification> {
    const now = this.deps.now();
    return this.t.insert({
      id: input.id ?? this.deps.idGen(),
      userId: input.userId ?? null,
      kind: input.kind,
      title: input.title,
      body: input.body,
      payload: input.payload ?? null,
      status: input.status ?? 'queued',
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
  async listByUser(userId: string): Promise<Notification[]> {
    return this.t.all().filter((n) => n.userId === userId);
  }
  async update(
    id: string,
    patch: Partial<Notification>,
  ): Promise<Notification | null> {
    const existing = this.t.byId(id);
    if (existing === null) return null;
    return this.t.insert({ ...existing, ...patch, updatedAt: this.deps.now() });
  }
}

/** Default deps for dev: random UUIDs + wall-clock timestamps. */
export const defaultRepoDeps: RepoDeps = {
  idGen: () => randomUUID(),
  now: () => new Date(),
};

export function createInMemoryRepositories(
  deps: RepoDeps = defaultRepoDeps,
): Repositories {
  return {
    users: new MemUserRepository(deps),
    accounts: new MemAccountRepository(deps),
    snapshots: new MemSnapshotRepository(deps),
    reports: new MemReportRepository(deps),
    reportDrafts: new MemReportDraftRepository(deps),
    uploads: new MemUploadRepository(deps),
    jobs: new MemJobRepository(deps),
    auditLogs: new MemAuditLogRepository(deps),
    orders: new MemOrderRepository(deps),
    entitlements: new MemEntitlementRepository(deps),
    emailDeliveries: new MemEmailDeliveryRepository(deps),
    coaches: new MemCoachRepository(deps),
    coachApplications: new MemCoachApplicationRepository(deps),
    reviewAssignments: new MemReviewAssignmentRepository(deps),
    moderations: new MemModerationRepository(deps),
    coachRatings: new MemCoachRatingRepository(deps),
    payoutAccounts: new MemPayoutAccountRepository(deps),
    payouts: new MemPayoutRepository(deps),
    disputes: new MemDisputeRepository(deps),
    notifications: new MemNotificationRepository(deps),
  };
}
