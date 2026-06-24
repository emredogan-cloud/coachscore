'use server';

import {
  handleProductCheckout,
  handleProductSubmit,
  type HandlerResult,
} from '@/lib/api';

/**
 * Server actions for the product UI (Phase 6). Thin wrappers over the
 * framework-agnostic handlers; same `{ status, body }` envelope as the routes.
 */

export async function requestProductSubmit(
  body: unknown,
): Promise<HandlerResult> {
  return handleProductSubmit(body);
}

export async function requestProductCheckout(
  body: unknown,
): Promise<HandlerResult> {
  return handleProductCheckout(body);
}
