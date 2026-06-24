import { NextResponse } from 'next/server';
import { handleProductSubmit } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/products/submit — analyze a ReplayDoctor / BaseDoctor / WarPlan
 * submission. The report is computed in-process and returned inline (works with
 * no credentials); AI enrichment runs only when ANTHROPIC_API_KEY is set, and
 * persistence is attempted only when the database is activated.
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
  const { status, body: out } = await handleProductSubmit(body);
  return NextResponse.json(out, { status });
}
