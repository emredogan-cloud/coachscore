/**
 * Drizzle/Postgres repositories (Phase 3) — the production persistence impl.
 *
 * Implements the same interfaces as the in-memory repositories, against the
 * lazy Drizzle client. This is real database I/O, exercised once Supabase
 * Postgres is provisioned (DATABASE_URL); the in-memory repositories cover the
 * logic in unit tests, so this file is outside coverage thresholds.
 */

import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import {
  accounts,
  accountSnapshots,
  auditLogs,
  coachApplications,
  coachRatings,
  coaches,
  disputes,
  emailDeliveries,
  entitlements,
  jobs,
  moderations,
  notifications,
  orders,
  payoutAccounts,
  payouts,
  productReports,
  productSubmissions,
  reportDrafts,
  reports,
  reviewAssignments,
  uploads,
  users,
} from '../schema';
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
  ProductSubmission,
  NewProductSubmission,
  ProductReportRow,
  NewProductReportRow,
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
  ProductReportRepository,
  ProductSubmissionRepository,
  Repositories,
  ReportDraftRepository,
  ReportRepository,
  ReviewAssignmentRepository,
  SnapshotRepository,
  UploadRepository,
  UserRepository,
} from './types';

function first<T>(rows: T[]): T {
  const row = rows[0];
  if (row === undefined) {
    throw new Error('Expected an inserted/updated row to be returned.');
  }
  return row;
}

class DrizzleUserRepository implements UserRepository {
  async create(input: NewUser): Promise<User> {
    return first(await getDb().insert(users).values(input).returning());
  }
  async findById(id: string): Promise<User | null> {
    const rows = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
  async findByEmail(email: string): Promise<User | null> {
    const rows = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return rows[0] ?? null;
  }
}

class DrizzleAccountRepository implements AccountRepository {
  async create(input: NewAccount): Promise<Account> {
    return first(await getDb().insert(accounts).values(input).returning());
  }
  async findById(id: string): Promise<Account | null> {
    const rows = await getDb()
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
  async listByUser(userId: string): Promise<Account[]> {
    return getDb().select().from(accounts).where(eq(accounts.userId, userId));
  }
}

class DrizzleSnapshotRepository implements SnapshotRepository {
  async create(input: NewAccountSnapshotRow): Promise<AccountSnapshotRow> {
    return first(
      await getDb().insert(accountSnapshots).values(input).returning(),
    );
  }
  async findById(id: string): Promise<AccountSnapshotRow | null> {
    const rows = await getDb()
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
  async findByHash(
    accountId: string,
    snapshotHash: string,
  ): Promise<AccountSnapshotRow | null> {
    const rows = await getDb()
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.snapshotHash, snapshotHash))
      .limit(1);
    return rows.find((r) => r.accountId === accountId) ?? null;
  }
}

class DrizzleReportRepository implements ReportRepository {
  async create(input: NewReport): Promise<Report> {
    return first(await getDb().insert(reports).values(input).returning());
  }
  async findById(id: string): Promise<Report | null> {
    const rows = await getDb()
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
  async listByAccount(accountId: string): Promise<Report[]> {
    return getDb()
      .select()
      .from(reports)
      .where(eq(reports.accountId, accountId));
  }
  async updateStatus(
    id: string,
    patch: Partial<Pick<Report, 'status' | 'overall' | 'grade' | 'paid'>>,
  ): Promise<Report | null> {
    const rows = await getDb()
      .update(reports)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return rows[0] ?? null;
  }
}

class DrizzleReportDraftRepository implements ReportDraftRepository {
  async create(input: NewReportDraftRow): Promise<ReportDraftRow> {
    return first(await getDb().insert(reportDrafts).values(input).returning());
  }
  async listByReport(reportId: string): Promise<ReportDraftRow[]> {
    return getDb()
      .select()
      .from(reportDrafts)
      .where(eq(reportDrafts.reportId, reportId));
  }
}

class DrizzleUploadRepository implements UploadRepository {
  async create(input: NewUpload): Promise<Upload> {
    return first(await getDb().insert(uploads).values(input).returning());
  }
  async findById(id: string): Promise<Upload | null> {
    const rows = await getDb()
      .select()
      .from(uploads)
      .where(eq(uploads.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
  async updateStatus(
    id: string,
    status: Upload['status'],
  ): Promise<Upload | null> {
    const rows = await getDb()
      .update(uploads)
      .set({ status })
      .where(eq(uploads.id, id))
      .returning();
    return rows[0] ?? null;
  }
}

class DrizzleJobRepository implements JobRepository {
  async create(input: NewJob): Promise<Job> {
    return first(await getDb().insert(jobs).values(input).returning());
  }
  async findByIdempotencyKey(key: string): Promise<Job | null> {
    const rows = await getDb()
      .select()
      .from(jobs)
      .where(eq(jobs.idempotencyKey, key))
      .limit(1);
    return rows[0] ?? null;
  }
  async update(
    id: string,
    patch: Partial<Pick<Job, 'status' | 'attempts' | 'result' | 'error'>>,
  ): Promise<Job | null> {
    const rows = await getDb()
      .update(jobs)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return rows[0] ?? null;
  }
}

class DrizzleAuditLogRepository implements AuditLogRepository {
  async create(input: NewAuditLog): Promise<AuditLog> {
    return first(await getDb().insert(auditLogs).values(input).returning());
  }
  async listByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    const rows = await getDb()
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityType, entityType));
    return rows.filter((r) => r.entityId === entityId);
  }
}

class DrizzleOrderRepository implements OrderRepository {
  async create(input: NewOrder): Promise<Order> {
    return first(await getDb().insert(orders).values(input).returning());
  }
  async findById(id: string): Promise<Order | null> {
    const rows = await getDb()
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
  async findByStripeSessionId(sessionId: string): Promise<Order | null> {
    const rows = await getDb()
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, sessionId))
      .limit(1);
    return rows[0] ?? null;
  }
  async listByUser(userId: string): Promise<Order[]> {
    return getDb().select().from(orders).where(eq(orders.userId, userId));
  }
  async update(
    id: string,
    patch: Partial<
      Pick<Order, 'status' | 'stripeSessionId' | 'stripePaymentIntentId'>
    >,
  ): Promise<Order | null> {
    const rows = await getDb()
      .update(orders)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return rows[0] ?? null;
  }
}

class DrizzleEntitlementRepository implements EntitlementRepository {
  async create(input: NewEntitlement): Promise<Entitlement> {
    return first(await getDb().insert(entitlements).values(input).returning());
  }
  async listByUser(userId: string): Promise<Entitlement[]> {
    return getDb()
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, userId));
  }
  async findForReport(
    userId: string,
    reportId: string,
  ): Promise<Entitlement | null> {
    const rows = await getDb()
      .select()
      .from(entitlements)
      .where(eq(entitlements.reportId, reportId));
    return rows.find((e) => e.userId === userId) ?? null;
  }
}

class DrizzleEmailDeliveryRepository implements EmailDeliveryRepository {
  async create(input: NewEmailDelivery): Promise<EmailDelivery> {
    return first(
      await getDb().insert(emailDeliveries).values(input).returning(),
    );
  }
  async findById(id: string): Promise<EmailDelivery | null> {
    const rows = await getDb()
      .select()
      .from(emailDeliveries)
      .where(eq(emailDeliveries.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
  async update(
    id: string,
    patch: Partial<Pick<EmailDelivery, 'status' | 'providerId' | 'error'>>,
  ): Promise<EmailDelivery | null> {
    const rows = await getDb()
      .update(emailDeliveries)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(emailDeliveries.id, id))
      .returning();
    return rows[0] ?? null;
  }
}

class DrizzleCoachRepository implements CoachRepository {
  async create(input: NewCoach): Promise<Coach> {
    return first(await getDb().insert(coaches).values(input).returning());
  }
  async findById(id: string): Promise<Coach | null> {
    const r = await getDb()
      .select()
      .from(coaches)
      .where(eq(coaches.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async findByUserId(userId: string): Promise<Coach | null> {
    const r = await getDb()
      .select()
      .from(coaches)
      .where(eq(coaches.userId, userId))
      .limit(1);
    return r[0] ?? null;
  }
  async listByStatus(status: Coach['status']): Promise<Coach[]> {
    return getDb().select().from(coaches).where(eq(coaches.status, status));
  }
  async listActive(): Promise<Coach[]> {
    return getDb().select().from(coaches).where(eq(coaches.status, 'active'));
  }
  async update(id: string, patch: Partial<Coach>): Promise<Coach | null> {
    const r = await getDb()
      .update(coaches)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(coaches.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleCoachApplicationRepository implements CoachApplicationRepository {
  async create(input: NewCoachApplication): Promise<CoachApplication> {
    return first(
      await getDb().insert(coachApplications).values(input).returning(),
    );
  }
  async findById(id: string): Promise<CoachApplication | null> {
    const r = await getDb()
      .select()
      .from(coachApplications)
      .where(eq(coachApplications.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async listByStatus(
    status: CoachApplication['status'],
  ): Promise<CoachApplication[]> {
    return getDb()
      .select()
      .from(coachApplications)
      .where(eq(coachApplications.status, status));
  }
  async update(
    id: string,
    patch: Partial<CoachApplication>,
  ): Promise<CoachApplication | null> {
    const r = await getDb()
      .update(coachApplications)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(coachApplications.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleReviewAssignmentRepository implements ReviewAssignmentRepository {
  async create(input: NewReviewAssignment): Promise<ReviewAssignment> {
    return first(
      await getDb().insert(reviewAssignments).values(input).returning(),
    );
  }
  async findById(id: string): Promise<ReviewAssignment | null> {
    const r = await getDb()
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async listByStatus(
    status: ReviewAssignment['status'],
  ): Promise<ReviewAssignment[]> {
    return getDb()
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.status, status));
  }
  async listByCoach(coachId: string): Promise<ReviewAssignment[]> {
    return getDb()
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.coachId, coachId));
  }
  async update(
    id: string,
    patch: Partial<ReviewAssignment>,
  ): Promise<ReviewAssignment | null> {
    const r = await getDb()
      .update(reviewAssignments)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(reviewAssignments.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleModerationRepository implements ModerationRepository {
  async create(input: NewModeration): Promise<Moderation> {
    return first(await getDb().insert(moderations).values(input).returning());
  }
  async findById(id: string): Promise<Moderation | null> {
    const r = await getDb()
      .select()
      .from(moderations)
      .where(eq(moderations.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async findByAssignment(
    reviewAssignmentId: string,
  ): Promise<Moderation | null> {
    const r = await getDb()
      .select()
      .from(moderations)
      .where(eq(moderations.reviewAssignmentId, reviewAssignmentId))
      .limit(1);
    return r[0] ?? null;
  }
  async update(
    id: string,
    patch: Partial<Moderation>,
  ): Promise<Moderation | null> {
    const r = await getDb()
      .update(moderations)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(moderations.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleCoachRatingRepository implements CoachRatingRepository {
  async create(input: NewCoachRating): Promise<CoachRating> {
    return first(await getDb().insert(coachRatings).values(input).returning());
  }
  async listByCoach(coachId: string): Promise<CoachRating[]> {
    return getDb()
      .select()
      .from(coachRatings)
      .where(eq(coachRatings.coachId, coachId));
  }
  async update(
    id: string,
    patch: Partial<CoachRating>,
  ): Promise<CoachRating | null> {
    const r = await getDb()
      .update(coachRatings)
      .set(patch)
      .where(eq(coachRatings.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzlePayoutAccountRepository implements PayoutAccountRepository {
  async create(input: NewPayoutAccount): Promise<PayoutAccount> {
    return first(
      await getDb().insert(payoutAccounts).values(input).returning(),
    );
  }
  async findByCoach(coachId: string): Promise<PayoutAccount | null> {
    const r = await getDb()
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.coachId, coachId))
      .limit(1);
    return r[0] ?? null;
  }
  async update(
    id: string,
    patch: Partial<PayoutAccount>,
  ): Promise<PayoutAccount | null> {
    const r = await getDb()
      .update(payoutAccounts)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(payoutAccounts.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzlePayoutRepository implements PayoutRepository {
  async create(input: NewPayout): Promise<Payout> {
    return first(await getDb().insert(payouts).values(input).returning());
  }
  async findById(id: string): Promise<Payout | null> {
    const r = await getDb()
      .select()
      .from(payouts)
      .where(eq(payouts.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async listByCoach(coachId: string): Promise<Payout[]> {
    return getDb().select().from(payouts).where(eq(payouts.coachId, coachId));
  }
  async update(id: string, patch: Partial<Payout>): Promise<Payout | null> {
    const r = await getDb()
      .update(payouts)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(payouts.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleDisputeRepository implements DisputeRepository {
  async create(input: NewDispute): Promise<Dispute> {
    return first(await getDb().insert(disputes).values(input).returning());
  }
  async findById(id: string): Promise<Dispute | null> {
    const r = await getDb()
      .select()
      .from(disputes)
      .where(eq(disputes.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async listByStatus(status: Dispute['status']): Promise<Dispute[]> {
    return getDb().select().from(disputes).where(eq(disputes.status, status));
  }
  async update(id: string, patch: Partial<Dispute>): Promise<Dispute | null> {
    const r = await getDb()
      .update(disputes)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(disputes.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleNotificationRepository implements NotificationRepository {
  async create(input: NewNotification): Promise<Notification> {
    return first(await getDb().insert(notifications).values(input).returning());
  }
  async listByUser(userId: string): Promise<Notification[]> {
    return getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
  }
  async update(
    id: string,
    patch: Partial<Notification>,
  ): Promise<Notification | null> {
    const r = await getDb()
      .update(notifications)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleProductSubmissionRepository implements ProductSubmissionRepository {
  async create(input: NewProductSubmission): Promise<ProductSubmission> {
    return first(
      await getDb().insert(productSubmissions).values(input).returning(),
    );
  }
  async findById(id: string): Promise<ProductSubmission | null> {
    const r = await getDb()
      .select()
      .from(productSubmissions)
      .where(eq(productSubmissions.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async update(
    id: string,
    patch: Partial<ProductSubmission>,
  ): Promise<ProductSubmission | null> {
    const r = await getDb()
      .update(productSubmissions)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(productSubmissions.id, id))
      .returning();
    return r[0] ?? null;
  }
}

class DrizzleProductReportRepository implements ProductReportRepository {
  async create(input: NewProductReportRow): Promise<ProductReportRow> {
    return first(
      await getDb().insert(productReports).values(input).returning(),
    );
  }
  async findById(id: string): Promise<ProductReportRow | null> {
    const r = await getDb()
      .select()
      .from(productReports)
      .where(eq(productReports.id, id))
      .limit(1);
    return r[0] ?? null;
  }
  async findBySubmission(
    submissionId: string,
  ): Promise<ProductReportRow | null> {
    const r = await getDb()
      .select()
      .from(productReports)
      .where(eq(productReports.submissionId, submissionId))
      .limit(1);
    return r[0] ?? null;
  }
  async listByStatus(
    status: ProductReportRow['status'],
  ): Promise<ProductReportRow[]> {
    return getDb()
      .select()
      .from(productReports)
      .where(eq(productReports.status, status));
  }
  async update(
    id: string,
    patch: Partial<ProductReportRow>,
  ): Promise<ProductReportRow | null> {
    const r = await getDb()
      .update(productReports)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(productReports.id, id))
      .returning();
    return r[0] ?? null;
  }
}

export function createDrizzleRepositories(): Repositories {
  return {
    users: new DrizzleUserRepository(),
    accounts: new DrizzleAccountRepository(),
    snapshots: new DrizzleSnapshotRepository(),
    reports: new DrizzleReportRepository(),
    reportDrafts: new DrizzleReportDraftRepository(),
    uploads: new DrizzleUploadRepository(),
    jobs: new DrizzleJobRepository(),
    auditLogs: new DrizzleAuditLogRepository(),
    orders: new DrizzleOrderRepository(),
    entitlements: new DrizzleEntitlementRepository(),
    emailDeliveries: new DrizzleEmailDeliveryRepository(),
    coaches: new DrizzleCoachRepository(),
    coachApplications: new DrizzleCoachApplicationRepository(),
    reviewAssignments: new DrizzleReviewAssignmentRepository(),
    moderations: new DrizzleModerationRepository(),
    coachRatings: new DrizzleCoachRatingRepository(),
    payoutAccounts: new DrizzlePayoutAccountRepository(),
    payouts: new DrizzlePayoutRepository(),
    disputes: new DrizzleDisputeRepository(),
    notifications: new DrizzleNotificationRepository(),
    productSubmissions: new DrizzleProductSubmissionRepository(),
    productReports: new DrizzleProductReportRepository(),
  };
}
