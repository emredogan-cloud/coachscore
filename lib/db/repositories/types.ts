/**
 * Repository interfaces (Phase 3) — the persistence boundary.
 *
 * The service layer depends only on these interfaces, so it is unit-tested
 * against in-memory implementations and runs unchanged against the Drizzle/
 * Postgres implementations at activation. `RepoDeps` injects id + clock so the
 * in-memory store is deterministic in tests.
 */

import type {
  Account,
  AccountSnapshotRow,
  AuditLog,
  Coach,
  CoachApplication,
  CoachRating,
  Dispute,
  EmailDelivery,
  Entitlement,
  Job,
  Moderation,
  NewAccount,
  NewAccountSnapshotRow,
  NewAuditLog,
  NewCoach,
  NewCoachApplication,
  NewCoachRating,
  NewDispute,
  NewEmailDelivery,
  NewEntitlement,
  NewJob,
  NewModeration,
  NewNotification,
  NewOrder,
  NewPayout,
  NewPayoutAccount,
  NewReport,
  NewReportDraftRow,
  NewReviewAssignment,
  NewUpload,
  NewUser,
  Notification,
  Order,
  Payout,
  PayoutAccount,
  Report,
  ReportDraftRow,
  ReviewAssignment,
  Upload,
  User,
} from '../schema';

export interface RepoDeps {
  readonly idGen: () => string;
  readonly now: () => Date;
}

export interface UserRepository {
  create(input: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface AccountRepository {
  create(input: NewAccount): Promise<Account>;
  findById(id: string): Promise<Account | null>;
  listByUser(userId: string): Promise<Account[]>;
}

export interface SnapshotRepository {
  create(input: NewAccountSnapshotRow): Promise<AccountSnapshotRow>;
  findById(id: string): Promise<AccountSnapshotRow | null>;
  findByHash(
    accountId: string,
    snapshotHash: string,
  ): Promise<AccountSnapshotRow | null>;
}

export interface ReportRepository {
  create(input: NewReport): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  listByAccount(accountId: string): Promise<Report[]>;
  updateStatus(
    id: string,
    patch: Partial<Pick<Report, 'status' | 'overall' | 'grade' | 'paid'>>,
  ): Promise<Report | null>;
}

export interface ReportDraftRepository {
  create(input: NewReportDraftRow): Promise<ReportDraftRow>;
  listByReport(reportId: string): Promise<ReportDraftRow[]>;
}

export interface UploadRepository {
  create(input: NewUpload): Promise<Upload>;
  findById(id: string): Promise<Upload | null>;
  updateStatus(id: string, status: Upload['status']): Promise<Upload | null>;
}

export interface JobRepository {
  create(input: NewJob): Promise<Job>;
  findByIdempotencyKey(key: string): Promise<Job | null>;
  update(
    id: string,
    patch: Partial<Pick<Job, 'status' | 'attempts' | 'result' | 'error'>>,
  ): Promise<Job | null>;
}

export interface AuditLogRepository {
  create(input: NewAuditLog): Promise<AuditLog>;
  listByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
}

export interface OrderRepository {
  create(input: NewOrder): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByStripeSessionId(sessionId: string): Promise<Order | null>;
  listByUser(userId: string): Promise<Order[]>;
  update(
    id: string,
    patch: Partial<
      Pick<Order, 'status' | 'stripeSessionId' | 'stripePaymentIntentId'>
    >,
  ): Promise<Order | null>;
}

export interface EntitlementRepository {
  create(input: NewEntitlement): Promise<Entitlement>;
  listByUser(userId: string): Promise<Entitlement[]>;
  findForReport(userId: string, reportId: string): Promise<Entitlement | null>;
}

export interface EmailDeliveryRepository {
  create(input: NewEmailDelivery): Promise<EmailDelivery>;
  findById(id: string): Promise<EmailDelivery | null>;
  update(
    id: string,
    patch: Partial<Pick<EmailDelivery, 'status' | 'providerId' | 'error'>>,
  ): Promise<EmailDelivery | null>;
}

export interface CoachRepository {
  create(input: NewCoach): Promise<Coach>;
  findById(id: string): Promise<Coach | null>;
  findByUserId(userId: string): Promise<Coach | null>;
  listByStatus(status: Coach['status']): Promise<Coach[]>;
  listActive(): Promise<Coach[]>;
  update(id: string, patch: Partial<Coach>): Promise<Coach | null>;
}

export interface CoachApplicationRepository {
  create(input: NewCoachApplication): Promise<CoachApplication>;
  findById(id: string): Promise<CoachApplication | null>;
  listByStatus(status: CoachApplication['status']): Promise<CoachApplication[]>;
  update(
    id: string,
    patch: Partial<CoachApplication>,
  ): Promise<CoachApplication | null>;
}

export interface ReviewAssignmentRepository {
  create(input: NewReviewAssignment): Promise<ReviewAssignment>;
  findById(id: string): Promise<ReviewAssignment | null>;
  listByStatus(status: ReviewAssignment['status']): Promise<ReviewAssignment[]>;
  listByCoach(coachId: string): Promise<ReviewAssignment[]>;
  update(
    id: string,
    patch: Partial<ReviewAssignment>,
  ): Promise<ReviewAssignment | null>;
}

export interface ModerationRepository {
  create(input: NewModeration): Promise<Moderation>;
  findById(id: string): Promise<Moderation | null>;
  findByAssignment(reviewAssignmentId: string): Promise<Moderation | null>;
  update(id: string, patch: Partial<Moderation>): Promise<Moderation | null>;
}

export interface CoachRatingRepository {
  create(input: NewCoachRating): Promise<CoachRating>;
  listByCoach(coachId: string): Promise<CoachRating[]>;
  update(id: string, patch: Partial<CoachRating>): Promise<CoachRating | null>;
}

export interface PayoutAccountRepository {
  create(input: NewPayoutAccount): Promise<PayoutAccount>;
  findByCoach(coachId: string): Promise<PayoutAccount | null>;
  update(
    id: string,
    patch: Partial<PayoutAccount>,
  ): Promise<PayoutAccount | null>;
}

export interface PayoutRepository {
  create(input: NewPayout): Promise<Payout>;
  findById(id: string): Promise<Payout | null>;
  listByCoach(coachId: string): Promise<Payout[]>;
  update(id: string, patch: Partial<Payout>): Promise<Payout | null>;
}

export interface DisputeRepository {
  create(input: NewDispute): Promise<Dispute>;
  findById(id: string): Promise<Dispute | null>;
  listByStatus(status: Dispute['status']): Promise<Dispute[]>;
  update(id: string, patch: Partial<Dispute>): Promise<Dispute | null>;
}

export interface NotificationRepository {
  create(input: NewNotification): Promise<Notification>;
  listByUser(userId: string): Promise<Notification[]>;
  update(
    id: string,
    patch: Partial<Notification>,
  ): Promise<Notification | null>;
}

export interface Repositories {
  readonly users: UserRepository;
  readonly accounts: AccountRepository;
  readonly snapshots: SnapshotRepository;
  readonly reports: ReportRepository;
  readonly reportDrafts: ReportDraftRepository;
  readonly uploads: UploadRepository;
  readonly jobs: JobRepository;
  readonly auditLogs: AuditLogRepository;
  readonly orders: OrderRepository;
  readonly entitlements: EntitlementRepository;
  readonly emailDeliveries: EmailDeliveryRepository;
  readonly coaches: CoachRepository;
  readonly coachApplications: CoachApplicationRepository;
  readonly reviewAssignments: ReviewAssignmentRepository;
  readonly moderations: ModerationRepository;
  readonly coachRatings: CoachRatingRepository;
  readonly payoutAccounts: PayoutAccountRepository;
  readonly payouts: PayoutRepository;
  readonly disputes: DisputeRepository;
  readonly notifications: NotificationRepository;
}
