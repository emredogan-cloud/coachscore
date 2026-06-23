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
  EmailDelivery,
  Entitlement,
  Job,
  NewAccount,
  NewAccountSnapshotRow,
  NewAuditLog,
  NewEmailDelivery,
  NewEntitlement,
  NewJob,
  NewOrder,
  NewReport,
  NewReportDraftRow,
  NewUpload,
  NewUser,
  Order,
  Report,
  ReportDraftRow,
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
}
