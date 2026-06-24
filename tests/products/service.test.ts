import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { Repositories, RepoDeps } from '@/lib/db';
import { AuthorizationError } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import type { AiProvider } from '@/lib/ai';
import { MarketplaceService } from '@/lib/marketplace';
import { createProductCheckout, type PaymentProvider } from '@/lib/payments';
import {
  ProductService,
  ProductServiceError,
  runProductAnalysis,
  type ProductReportView,
} from '@/lib/products';
import { fakeProvider } from '../intake/helpers';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

const admin: Identity = { userId: 'admin', role: 'admin' };
const coachUser: Identity = { userId: 'coachU', role: 'coach' };
const user: Identity = { userId: 'u1', role: 'user' };
const otherUser: Identity = { userId: 'u2', role: 'user' };
const anon: Identity = { userId: null, role: 'anon' };

const replayInput = {
  townHall: 14,
  context: 'war' as const,
  starsEarned: 2,
  destructionPct: 80,
  durationSec: 180,
  timeRemainingSec: 30,
  army: [],
  heroesUsed: [],
  heroesAvailable: [],
  spellsUsed: [],
};

const throwingProvider: AiProvider = {
  async generate() {
    throw new Error('upstream timeout');
  },
};

const fakePayment = (sessionId = 'cs_prod_1'): PaymentProvider => ({
  async createCheckoutSession() {
    return { sessionId, url: `https://stripe.test/${sessionId}` };
  },
});

let repos: Repositories;
let svc: ProductService;
let market: MarketplaceService;
beforeEach(() => {
  repos = createInMemoryRepositories(deps());
  svc = new ProductService(repos);
  market = new MarketplaceService(
    repos,
    () => new Date('2026-06-24T12:00:00.000Z'),
  );
});

async function activeCoach() {
  const app = await market.applyAsCoach(coachUser, {
    displayName: 'WarCoach',
    bio: 'I have coached competitive war clans for five years running.',
    specialties: ['war'],
    motivation: 'I want to help players climb the war ladder efficiently.',
    experience: 'Led three clans to Champion League over multiple seasons.',
  });
  const coach = await market.approveApplication(admin, app.id);
  await market.activateCoach(coachUser, coach.id);
  return coach;
}

describe('runProductAnalysis (pipeline)', () => {
  const request = { sku: 'replay_doctor' as const, input: replayInput };

  it('returns the deterministic report when no AI provider is supplied', async () => {
    const report = await runProductAnalysis(request);
    expect(report.sku).toBe('replay_doctor');
    expect(report.aiAuthored).toBe(false);
    expect(report.confidence).toBe(1);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('enriches with AI recommendations on a valid draft', async () => {
    const provider = fakeProvider({
      summary:
        'A tight, grounded summary of the attack, well over twenty chars.',
      recommendations: ['Funnel the sides first.', 'Hold rage for the core.'],
    });
    const deterministic = await runProductAnalysis(request);
    const report = await runProductAnalysis(request, { provider });
    expect(report.aiAuthored).toBe(true);
    expect(report.confidence).toBe(0.9);
    expect(report.recommendations.length).toBe(
      deterministic.recommendations.length + 2,
    );
  });

  it('falls back to the deterministic report when the AI provider throws', async () => {
    const report = await runProductAnalysis(request, {
      provider: throwingProvider,
    });
    expect(report.aiAuthored).toBe(false);
    expect(report.confidence).toBe(1);
  });
});

async function buildReport(): Promise<ProductReportView> {
  return runProductAnalysis({ sku: 'replay_doctor', input: replayInput });
}

describe('ProductService.saveProductReport', () => {
  it('persists submission + report and queues it for review (human_reviewed SKU)', async () => {
    const report = await buildReport();
    const saved = await svc.saveProductReport({
      identity: user,
      sku: 'replay_doctor',
      input: replayInput,
      report,
      context: 'War day attack vs ring base',
    });
    expect(saved.submission.userId).toBe('u1');
    expect(saved.submission.status).toBe('analyzed');
    expect(saved.report.status).toBe('awaiting_review');
    expect(saved.report.scoreValue).toBe(report.score?.value);
    expect(saved.report.paid).toBe(false);

    const audit = await repos.auditLogs.listByEntity(
      'product_report',
      saved.report.id,
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]?.action).toBe('product.report.created');
  });

  it('denies an anonymous identity (deny-by-default)', async () => {
    const report = await buildReport();
    await expect(
      svc.saveProductReport({
        identity: anon,
        sku: 'replay_doctor',
        input: replayInput,
        report,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});

describe('ProductService.getReport (ownership)', () => {
  it('lets the owner read, hides it from other users, and lets coaches read', async () => {
    const report = await buildReport();
    const { report: row } = await svc.saveProductReport({
      identity: user,
      sku: 'replay_doctor',
      input: replayInput,
      report,
    });
    expect(await svc.getReport(user, row.id)).not.toBeNull();
    expect(await svc.getReport(otherUser, row.id)).toBeNull();
    expect(await svc.getReport(coachUser, row.id)).not.toBeNull();
  });

  it('returns null for a missing report', async () => {
    expect(await svc.getReport(user, 'nope')).toBeNull();
  });
});

describe('ProductService.requestCoachReview', () => {
  it('creates a product-backed review assignment (admin only)', async () => {
    const report = await buildReport();
    const { report: row } = await svc.saveProductReport({
      identity: user,
      sku: 'replay_doctor',
      input: replayInput,
      report,
    });
    const ra = await svc.requestCoachReview(admin, row.id);
    expect(ra.productReportId).toBe(row.id);
    expect(ra.reportId).toBeNull();
    expect(ra.status).toBe('unassigned');
  });

  it('denies non-admins and throws on a missing report', async () => {
    await expect(svc.requestCoachReview(user, 'x')).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    await expect(
      svc.requestCoachReview(admin, 'missing'),
    ).rejects.toBeInstanceOf(ProductServiceError);
  });
});

describe('product report flows through the Phase-5 coach-review machine', () => {
  async function queued() {
    const report = await buildReport();
    const { report: row } = await svc.saveProductReport({
      identity: user,
      sku: 'replay_doctor',
      input: replayInput,
      report,
    });
    await activeCoach();
    const ra = await svc.requestCoachReview(admin, row.id);
    return { row, ra };
  }

  it('approve marks the product report approved', async () => {
    const { row, ra } = await queued();
    await market.claimReview(coachUser, ra.id);
    await market.startReview(coachUser, ra.id);
    const { moderation } = await market.submitReview(coachUser, ra.id, {
      notes: 'Solid attack, minor funnel issue.',
    });
    await market.moderateApprove(admin, moderation.id, { grossCents: 900 });
    expect((await repos.productReports.findById(row.id))?.status).toBe(
      'approved',
    );
  });

  it('reject marks the product report failed', async () => {
    const { row, ra } = await queued();
    await market.claimReview(coachUser, ra.id);
    await market.startReview(coachUser, ra.id);
    const { moderation } = await market.submitReview(coachUser, ra.id, {});
    await market.moderateReject(admin, moderation.id, 'Insufficient detail.');
    expect((await repos.productReports.findById(row.id))?.status).toBe(
      'failed',
    );
  });
});

describe('createProductCheckout', () => {
  it('creates a pending order on the productSku column and returns a session', async () => {
    const result = await createProductCheckout(
      {
        sku: 'war_plan',
        userId: 'u1',
        successUrl: 'https://app.test/ok',
        cancelUrl: 'https://app.test/cancel',
      },
      { provider: fakePayment('cs_war'), repos },
    );
    expect(result.amountCents).toBe(700);
    expect(result.url).toContain('cs_war');

    const order = await repos.orders.findById(result.orderId);
    expect(order?.productSku).toBe('war_plan');
    expect(order?.tier).toBeNull();
    expect(order?.amountCents).toBe(700);
    expect(order?.stripeSessionId).toBe('cs_war');
  });
});
