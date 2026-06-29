'use server';

import {
  handleCheckout,
  handleReport,
  handleReportByTag,
  type HandlerResult,
} from '@/lib/api';

/**
 * Server actions for the report + pricing UI. Thin wrappers over the
 * framework-agnostic handlers; same `{ status, body }` envelope as the routes.
 * `requestReportByTag` is the primary "paste tag → score" path; `requestReport`
 * is the manual fallback.
 */

export async function requestReportByTag(
  body: unknown,
): Promise<HandlerResult> {
  return handleReportByTag(body);
}

export async function requestReport(body: unknown): Promise<HandlerResult> {
  return handleReport(body);
}

export async function requestCheckout(body: unknown): Promise<HandlerResult> {
  return handleCheckout(body);
}
