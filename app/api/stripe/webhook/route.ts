import { NextResponse } from 'next/server';
import { handleStripeWebhookRequest } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/webhook — Stripe event sink. Reads the RAW body (required for
 * signature verification) and the `Stripe-Signature` header. Returns 503
 * not_activated until Stripe + the database are provisioned.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  const { status, body } = await handleStripeWebhookRequest(rawBody, signature);
  return NextResponse.json(body, { status });
}
