/**
 * Product persistence + review service (Phase 6).
 *
 * Mirrors the Phase-3 PersistenceService: deny-by-default authorization, audit
 * logging, and a dependency only on the `Repositories` interface (so it is unit-
 * tested with in-memory repos and runs unchanged against Postgres at activation).
 * The deterministic report is computed by the pipeline before it reaches here;
 * this service owns only the persistence + coach-review wiring, which is why the
 * inline report works with no database while saving/retrieval is DB-gated.
 */

import { assertCan, can } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import type {
  ProductReportRow,
  ProductSubmission,
  Repositories,
  ReviewAssignment,
} from '@/lib/db';
import { getProduct } from './catalog';
import type { ProductReportView, ProductSku } from './types';

export class ProductServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

export interface SaveProductReportInput {
  readonly identity: Identity;
  readonly sku: ProductSku;
  /** The validated, typed product input (persisted for audit + re-analysis). */
  readonly input: unknown;
  /** The already-computed report view (deterministic, optionally AI-enriched). */
  readonly report: ProductReportView;
  readonly context?: string;
  readonly uploadKeys?: readonly string[];
}

export interface SavedProductReport {
  readonly submission: ProductSubmission;
  readonly report: ProductReportRow;
}

export class ProductService {
  constructor(private readonly repos: Repositories) {}

  /** Persist a computed product report + its submission (deny-by-default). */
  async saveProductReport(
    input: SaveProductReportInput,
  ): Promise<SavedProductReport> {
    assertCan(input.identity, 'product:create');

    const submission = await this.repos.productSubmissions.create({
      userId: input.identity.userId ?? null,
      sku: input.sku,
      context: input.context ?? null,
      input: input.input,
      uploadKeys: input.uploadKeys ? [...input.uploadKeys] : null,
      status: 'analyzed',
    });

    const requiresReview =
      getProduct(input.sku).fulfillment === 'human_reviewed';
    const report = await this.repos.productReports.create({
      submissionId: submission.id,
      sku: input.sku,
      analysis: input.report,
      scoreLabel: input.report.score?.label ?? null,
      scoreValue: input.report.score?.value ?? null,
      confidence: input.report.confidence,
      status: requiresReview ? 'awaiting_review' : 'pending',
      paid: false,
    });

    await this.repos.auditLogs.create({
      actorUserId: input.identity.userId,
      action: 'product.report.created',
      entityType: 'product_report',
      entityId: report.id,
      metadata: { sku: input.sku, requiresReview },
    });

    return { submission, report };
  }

  /** Fetch a product report the caller may read (owner, or elevated coach/admin). */
  async getReport(
    identity: Identity,
    reportId: string,
  ): Promise<ProductReportRow | null> {
    const report = await this.repos.productReports.findById(reportId);
    if (report === null) return null;
    if (can(identity, 'report:read:any')) return report; // coaches + admins
    if (!can(identity, 'product:read:own')) return null;
    const submission = await this.repos.productSubmissions.findById(
      report.submissionId,
    );
    const owns =
      submission !== null &&
      submission.userId !== null &&
      submission.userId === identity.userId;
    return owns ? report : null;
  }

  /**
   * Queue a product report for coach review — reuses the Phase-5 review-assignment
   * state machine via the nullable `productReportId` discriminator.
   */
  async requestCoachReview(
    identity: Identity,
    reportId: string,
  ): Promise<ReviewAssignment> {
    assertCan(identity, 'admin:manage');
    const report = await this.repos.productReports.findById(reportId);
    if (report === null) {
      throw new ProductServiceError('Product report not found.');
    }
    const assignment = await this.repos.reviewAssignments.create({
      reportId: null,
      productReportId: report.id,
      reportDraftId: null,
      status: 'unassigned',
    });
    await this.repos.productReports.update(report.id, {
      status: 'awaiting_review',
    });
    await this.repos.auditLogs.create({
      actorUserId: identity.userId,
      action: 'product.review.created',
      entityType: 'review_assignment',
      entityId: assignment.id,
      metadata: { productReportId: report.id },
    });
    return assignment;
  }
}
