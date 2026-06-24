/**
 * Product persistence wiring (Phase 6) — the DB activation boundary.
 *
 * Resolves the real (Drizzle/Postgres) repositories and saves / fetches a product
 * report via the ProductService. Identity resolution is stubbed to anonymous
 * until Supabase Auth is wired, so until then persistence reports
 * `authentication_required` and retrieval returns null even when the database is
 * configured. Exercised at activation, not in unit tests (the handlers inject
 * fakes), so this file is outside coverage.
 */

import type { Identity } from '@/lib/auth';
import { createDrizzleRepositories } from '@/lib/db';
import {
  ProductService,
  type ProductInput,
  type ProductReportView,
} from '@/lib/products';

export interface ProductPersistenceInfo {
  readonly attempted: boolean;
  readonly persisted: boolean;
  readonly reason?: string;
  readonly reportId?: string;
}

/** Replaced by Supabase Auth session resolution at activation. */
function currentIdentity(): Identity {
  return { userId: null, role: 'anon' };
}

export async function persistProductReport(args: {
  readonly request: ProductInput;
  readonly report: ProductReportView;
  readonly context?: string;
  readonly uploadKeys?: readonly string[];
}): Promise<ProductPersistenceInfo> {
  const identity = currentIdentity();
  if (identity.userId === null) {
    return {
      attempted: true,
      persisted: false,
      reason: 'authentication_required',
    };
  }
  const service = new ProductService(createDrizzleRepositories());
  const saved = await service.saveProductReport({
    identity,
    sku: args.request.sku,
    input: args.request.input,
    report: args.report,
    context: args.context,
    uploadKeys: args.uploadKeys,
  });
  return { attempted: true, persisted: true, reportId: saved.report.id };
}

export async function resolveProductReport(
  reportId: string,
): Promise<ProductReportView | null> {
  const identity = currentIdentity();
  const service = new ProductService(createDrizzleRepositories());
  const row = await service.getReport(identity, reportId);
  return row?.analysis ?? null;
}
