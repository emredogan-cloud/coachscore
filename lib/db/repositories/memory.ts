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
} from '../schema';
import type {
  AccountRepository,
  AuditLogRepository,
  JobRepository,
  Repositories,
  RepoDeps,
  ReportDraftRepository,
  ReportRepository,
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
  };
}
