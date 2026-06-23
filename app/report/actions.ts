'use server';

import { handleCheckout, handleReport, type HandlerResult } from '@/lib/api';

/**
 * Server actions for the report + pricing UI (Phase 4). Thin wrappers over the
 * framework-agnostic handlers; same `{ status, body }` envelope as the routes.
 */

export async function requestReport(body: unknown): Promise<HandlerResult> {
  return handleReport(body);
}

export async function requestCheckout(body: unknown): Promise<HandlerResult> {
  return handleCheckout(body);
}
