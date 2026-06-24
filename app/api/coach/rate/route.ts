import { NextResponse } from 'next/server';
import { handleRateCoach } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST /api/coach/rate — rate a coach (1–5 stars). 503 until DB is activated. */
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
  const { status, body: out } = await handleRateCoach(body);
  return NextResponse.json(out, { status });
}
