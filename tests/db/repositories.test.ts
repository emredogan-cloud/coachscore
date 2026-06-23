import { describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import { TH14_WAR_EXAMPLE } from '../core/fixtures';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-23T00:00:00.000Z'),
  };
}

describe('in-memory repositories', () => {
  it('users: create, findById, findByEmail, defaults', async () => {
    const { users } = createInMemoryRepositories(deps());
    const u = await users.create({ email: 'a@b.co' });
    expect(u.id).toBe('id-1');
    expect(u.role).toBe('user'); // default
    expect(await users.findById('id-1')).toEqual(u);
    expect(await users.findByEmail('a@b.co')).toEqual(u);
    expect(await users.findById('missing')).toBeNull();
    expect(await users.findByEmail('missing')).toBeNull();
  });

  it('accounts: create + listByUser scoping', async () => {
    const { accounts } = createInMemoryRepositories(deps());
    await accounts.create({ userId: 'alice', townHall: 14, source: 'manual' });
    await accounts.create({ userId: 'alice', townHall: 15, source: 'tag' });
    await accounts.create({ userId: 'bob', townHall: 13, source: 'manual' });
    expect(await accounts.listByUser('alice')).toHaveLength(2);
    expect(await accounts.listByUser('bob')).toHaveLength(1);
  });

  it('snapshots: create, findById, findByHash', async () => {
    const { snapshots } = createInMemoryRepositories(deps());
    const s = await snapshots.create({
      accountId: 'acc-1',
      snapshotHash: 'hash-1',
      goal: 'war',
      townHall: 14,
      normalizedAccount: TH14_WAR_EXAMPLE,
      provenance: {
        source: 'manual',
        confidence: 1,
        fieldsNeedingConfirmation: [],
      },
      engineVersion: '1.0.0',
      referenceTableVersion: '0.1.0-th18',
      knowledgeBaseVersion: '0.1.0-th18',
    });
    expect(await snapshots.findById(s.id)).toEqual(s);
    expect(await snapshots.findByHash('acc-1', 'hash-1')).toEqual(s);
    expect(await snapshots.findByHash('acc-1', 'nope')).toBeNull();
    expect(await snapshots.findByHash('other', 'hash-1')).toBeNull();
  });

  it('reports: create (pending), updateStatus, listByAccount', async () => {
    const { reports } = createInMemoryRepositories(deps());
    const r = await reports.create({
      accountId: 'acc-1',
      snapshotId: 'snap-1',
      goal: 'war',
      tier: 'standard',
    });
    expect(r.status).toBe('pending');
    expect(r.paid).toBe(false);
    const updated = await reports.updateStatus(r.id, {
      status: 'approved',
      overall: 85,
      grade: 'A',
      paid: true,
    });
    expect(updated?.status).toBe('approved');
    expect(updated?.overall).toBe(85);
    expect(updated?.paid).toBe(true);
    expect(
      await reports.updateStatus('missing', { status: 'failed' }),
    ).toBeNull();
    expect(await reports.listByAccount('acc-1')).toHaveLength(1);
    expect(await reports.findById(r.id)).not.toBeNull();
  });

  it('reportDrafts: create + listByReport', async () => {
    const { reportDrafts } = createInMemoryRepositories(deps());
    await reportDrafts.create({
      reportId: 'rep-1',
      snapshotId: 'snap-1',
      confidence: 0.8,
      needsHumanReview: false,
      flags: [],
      attempts: 1,
      referenceReady: false,
    });
    const list = await reportDrafts.listByReport('rep-1');
    expect(list).toHaveLength(1);
    expect(list[0]?.draft).toBeNull(); // nullable default
  });

  it('uploads: create (pending) + updateStatus', async () => {
    const { uploads } = createInMemoryRepositories(deps());
    const up = await uploads.create({
      kind: 'screenshot',
      storageKey: 'screenshot/u/a.png',
      contentType: 'image/png',
      byteSize: 1234,
    });
    expect(up.status).toBe('pending');
    const stored = await uploads.updateStatus(up.id, 'stored');
    expect(stored?.status).toBe('stored');
    expect(await uploads.findById(up.id)).not.toBeNull();
    expect(await uploads.updateStatus('missing', 'failed')).toBeNull();
  });

  it('jobs: create, idempotency lookup, update', async () => {
    const { jobs } = createInMemoryRepositories(deps());
    const j = await jobs.create({
      idempotencyKey: 'key-1',
      kind: 'report_draft',
      payload: { reportId: 'rep-1' },
    });
    expect(j.status).toBe('pending');
    expect(j.attempts).toBe(0);
    expect(await jobs.findByIdempotencyKey('key-1')).toEqual(j);
    expect(await jobs.findByIdempotencyKey('nope')).toBeNull();
    const done = await jobs.update(j.id, {
      status: 'completed',
      attempts: 1,
      result: { ok: true },
    });
    expect(done?.status).toBe('completed');
    expect(await jobs.update('missing', { status: 'failed' })).toBeNull();
  });

  it('auditLogs: create + listByEntity', async () => {
    const { auditLogs } = createInMemoryRepositories(deps());
    await auditLogs.create({
      action: 'intake.saved',
      entityType: 'account_snapshot',
      entityId: 'snap-1',
    });
    await auditLogs.create({
      action: 'report.created',
      entityType: 'report',
      entityId: 'rep-1',
    });
    expect(
      await auditLogs.listByEntity('account_snapshot', 'snap-1'),
    ).toHaveLength(1);
    expect(await auditLogs.listByEntity('report', 'rep-1')).toHaveLength(1);
    expect(await auditLogs.listByEntity('report', 'other')).toHaveLength(0);
  });
});
