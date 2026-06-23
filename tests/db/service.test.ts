import { describe, expect, it } from 'vitest';
import {
  createInMemoryRepositories,
  IntakePersistenceError,
  PersistenceService,
} from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import { AuthorizationError } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import { intakeByTag, intakeManual } from '@/lib/intake';
import type { CocAccountData, CocApiAdapter, IntakeFields } from '@/lib/intake';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-23T00:00:00.000Z'),
  };
}

const fields: IntakeFields = {
  townHall: 14,
  heroLevels: {
    barbarianKing: 72,
    archerQueen: 75,
    grandWarden: 48,
    royalChampion: 22,
  },
  offensePercent: 85,
  defensePercent: 82,
  progressionPercent: 93,
  walls: { atOrAboveThMax: 85, total: 100 },
  clan: {
    donationBehavior: 0.78,
    warContribution: 0.78,
    capitalContribution: 0.78,
    activitySignal: 0.78,
  },
};

const alice: Identity = { userId: 'alice', role: 'user' };
const anon: Identity = { userId: null, role: 'anon' };

function service() {
  const repos = createInMemoryRepositories(deps());
  return { repos, svc: new PersistenceService(repos) };
}

describe('PersistenceService.saveIntake', () => {
  it('persists account + immutable snapshot + audit for a user', async () => {
    const { repos, svc } = service();
    const intake = intakeManual({ goal: 'war', fields });
    const saved = await svc.saveIntake({
      identity: alice,
      intake,
      label: 'main',
    });

    expect(saved.account.userId).toBe('alice');
    expect(saved.account.source).toBe('manual');
    expect(saved.account.label).toBe('main');
    expect(saved.snapshot.snapshotHash).toBe(intake.snapshot?.snapshotHash);
    expect(saved.snapshot.engineVersion).toBe('1.0.0');

    const audits = await repos.auditLogs.listByEntity(
      'account_snapshot',
      saved.snapshot.id,
    );
    expect(audits[0]?.action).toBe('intake.saved');

    const mine = await svc.listMyAccounts(alice);
    expect(mine).toHaveLength(1);
  });

  it('stores the canonical player tag for tag-sourced intake', async () => {
    const { svc } = service();
    const adapter: CocApiAdapter = {
      async fetchAccount(playerTag: string): Promise<CocAccountData> {
        return { playerTag, fields };
      },
    };
    const intake = await intakeByTag('#2PP0', 'war', { adapter });
    const saved = await svc.saveIntake({ identity: alice, intake });
    expect(saved.account.source).toBe('tag');
    expect(saved.account.playerTag).toBe('#2PP0');
  });

  it('denies anonymous identities (deny-by-default)', async () => {
    const { svc } = service();
    const intake = intakeManual({ goal: 'war', fields });
    await expect(svc.saveIntake({ identity: anon, intake })).rejects.toThrow(
      AuthorizationError,
    );
  });

  it('refuses to persist an unsuccessful intake', async () => {
    const { svc } = service();
    const bad = intakeManual({
      goal: 'war',
      fields: { ...fields, townHall: 5 },
    });
    await expect(
      svc.saveIntake({ identity: alice, intake: bad }),
    ).rejects.toThrow(IntakePersistenceError);
  });
});

describe('PersistenceService.createReport / recordUpload / listMyAccounts', () => {
  it('creates a pending report with an audit entry', async () => {
    const { repos, svc } = service();
    const intake = intakeManual({ goal: 'war', fields });
    const saved = await svc.saveIntake({ identity: alice, intake });
    const report = await svc.createReport({
      identity: alice,
      accountId: saved.account.id,
      snapshotId: saved.snapshot.id,
      goal: 'war',
      tier: 'standard',
    });
    expect(report.status).toBe('pending');
    expect(report.tier).toBe('standard');
    expect(
      await repos.auditLogs.listByEntity('report', report.id),
    ).toHaveLength(1);
  });

  it('records an upload owned by the caller', async () => {
    const { svc } = service();
    const upload = await svc.recordUpload({
      identity: alice,
      kind: 'screenshot',
      storageKey: 'screenshot/alice/a.png',
      contentType: 'image/png',
      byteSize: 2048,
    });
    expect(upload.userId).toBe('alice');
    expect(upload.status).toBe('pending');
  });

  it('denies listMyAccounts for anonymous (no permission)', async () => {
    const { svc } = service();
    await expect(svc.listMyAccounts(anon)).rejects.toThrow(AuthorizationError);
  });

  it('listMyAccounts returns [] for a permitted-but-unidentified identity', async () => {
    const { svc } = service();
    // Degenerate: a role that may read its own accounts but no user id.
    const ghost: Identity = { userId: null, role: 'user' };
    expect(await svc.listMyAccounts(ghost)).toEqual([]);
  });
});
