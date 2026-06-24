import { NextResponse } from 'next/server';
import { handleGetFlags } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/experiments/flags?subjectId=... — evaluate every feature flag for a
 * subject. Deterministic; works with no credentials.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const subjectId = new URL(request.url).searchParams.get('subjectId');
  const { status, body: out } = handleGetFlags({ subjectId });
  return NextResponse.json(out, { status });
}
