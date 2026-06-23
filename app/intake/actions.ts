'use server';

import {
  handleManualIntake,
  handleScreenshotIntake,
  handleTagIntake,
  type HandlerResult,
} from '@/lib/api';

/**
 * Server actions backing the intake wizard (Phase 3). Thin wrappers over the
 * framework-agnostic handlers, so the UI can submit without a client-side fetch.
 * Each returns the same `{ status, body }` envelope the API routes return.
 */

export async function submitManualIntake(
  body: unknown,
): Promise<HandlerResult> {
  return handleManualIntake(body);
}

export async function submitTagIntake(body: unknown): Promise<HandlerResult> {
  return handleTagIntake(body);
}

export async function submitScreenshotIntake(
  body: unknown,
): Promise<HandlerResult> {
  return handleScreenshotIntake(body);
}
