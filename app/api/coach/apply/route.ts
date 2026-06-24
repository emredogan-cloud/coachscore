import { NextResponse } from 'next/server';
import { handleCoachApply } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/coach/apply — submit a coach application. Returns 503 not_activated
 * until the database (+ Supabase Auth) is provisioned.
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
  const { status, body: out } = await handleCoachApply(body);
  return NextResponse.json(out, { status });
}
