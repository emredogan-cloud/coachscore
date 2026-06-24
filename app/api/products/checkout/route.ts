import { NextResponse } from 'next/server';
import { handleProductCheckout } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/products/checkout — create a Stripe checkout session for a product
 * SKU. Returns 503 not_activated until Stripe + the database are provisioned.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'validation_error', message: 'Invalid JSON body.' } },
      { status: 422 },
    );
  }
  const { status, body: out } = await handleProductCheckout(body);
  return NextResponse.json(out, { status });
}
