/**
 * Persistence service (Phase 3) — the application-level write API.
 *
 * Orchestrates repositories with authorization (deny-by-default) and audit
 * logging. Depends only on the `Repositories` interface, so it is fully
 * unit-tested with in-memory repos and runs unchanged against Postgres at
 * activation.
 */

import { assertCan } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import type { Goal } from '@/lib/core';
import type { IntakeResult } from '@/lib/intake';
import type { Repositories } from './repositories/types';
import type { Account, AccountSnapshotRow, Report, Upload } from './schema';

export class IntakePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntakePersistenceError';
  }
}

export interface SaveIntakeInput {
  readonly identity: Identity;
  readonly intake: IntakeResult;
  readonly label?: string;
}

export interface SavedIntake {
  readonly account: Account;
  readonly snapshot: AccountSnapshotRow;
}

export interface CreateReportInput {
  readonly identity: Identity;
  readonly accountId: string;
  readonly snapshotId: string;
  readonly goal: Goal;
  readonly tier: Report['tier'];
}

export interface RecordUploadInput {
  readonly identity: Identity;
  readonly accountId?: string;
  readonly kind: Upload['kind'];
  readonly storageKey: string;
  readonly contentType: string;
  readonly byteSize: number;
}

export class PersistenceService {
  constructor(private readonly repos: Repositories) {}

  /** Persist a successful intake as an account + immutable snapshot + audit. */
  async saveIntake(input: SaveIntakeInput): Promise<SavedIntake> {
    const { identity, intake } = input;
    assertCan(identity, 'account:create');
    assertCan(identity, 'snapshot:create');

    if (!intake.ok || intake.snapshot === null) {
      throw new IntakePersistenceError(
        'Cannot persist an unsuccessful intake.',
      );
    }
    if (identity.userId === null) {
      throw new IntakePersistenceError(
        'Cannot persist intake for an anonymous identity.',
      );
    }

    const snap = intake.snapshot;
    const account = await this.repos.accounts.create({
      userId: identity.userId,
      playerTag:
        snap.provenance.source === 'tag'
          ? (snap.provenance.note ?? null)
          : null,
      townHall: snap.account.townHall,
      source: snap.provenance.source,
      label: input.label ?? null,
    });

    const snapshot = await this.repos.snapshots.create({
      accountId: account.id,
      snapshotHash: snap.snapshotHash,
      goal: snap.goal,
      townHall: snap.account.townHall,
      normalizedAccount: snap.account,
      provenance: snap.provenance,
      engineVersion: snap.lock.engineVersion,
      referenceTableVersion: snap.lock.referenceTableVersion,
      knowledgeBaseVersion: snap.lock.knowledgeBaseVersion,
    });

    await this.repos.auditLogs.create({
      actorUserId: identity.userId,
      action: 'intake.saved',
      entityType: 'account_snapshot',
      entityId: snapshot.id,
      metadata: { source: snap.provenance.source, hash: snap.snapshotHash },
    });

    return { account, snapshot };
  }

  /** Create a pending report against a saved snapshot. */
  async createReport(input: CreateReportInput): Promise<Report> {
    assertCan(input.identity, 'report:create');
    const report = await this.repos.reports.create({
      accountId: input.accountId,
      snapshotId: input.snapshotId,
      goal: input.goal,
      tier: input.tier,
    });
    await this.repos.auditLogs.create({
      actorUserId: input.identity.userId,
      action: 'report.created',
      entityType: 'report',
      entityId: report.id,
      metadata: { tier: input.tier, goal: input.goal },
    });
    return report;
  }

  /** Record an upload's metadata (the bytes go to the storage adapter). */
  async recordUpload(input: RecordUploadInput): Promise<Upload> {
    assertCan(input.identity, 'upload:create');
    return this.repos.uploads.create({
      userId: input.identity.userId,
      accountId: input.accountId ?? null,
      kind: input.kind,
      storageKey: input.storageKey,
      contentType: input.contentType,
      byteSize: input.byteSize,
    });
  }

  /** List the caller's own accounts (deny-by-default). */
  async listMyAccounts(identity: Identity): Promise<Account[]> {
    assertCan(identity, 'account:read:own');
    if (identity.userId === null) return [];
    return this.repos.accounts.listByUser(identity.userId);
  }
}
