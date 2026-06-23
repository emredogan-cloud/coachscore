import { NextResponse } from 'next/server';
import { handleReport } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/report — assemble a CoachScore report from a manual intake body.
 * Returns the free teaser plus the full report when entitled (or `preview:true`).
 * Works with no credentials (scoring + assembly are in-process).
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
  const { status, body: out } = await handleReport(body);
  return NextResponse.json(out, { status });
}
