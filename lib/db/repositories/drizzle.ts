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
  emailDeliveries,
  entitlements,
  jobs,
  orders,
  reportDrafts,
  reports,
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
} from '../schema';
import type {
  AccountRepository,
  AuditLogRepository,
  EmailDeliveryRepository,
  EntitlementRepository,
  JobRepository,
  OrderRepository,
  Repositories,
  ReportDraftRepository,
  ReportRepository,
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
  };
}
