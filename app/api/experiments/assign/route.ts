import { NextResponse } from 'next/server';
import { handleAssignExperiment } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/experiments/assign — deterministically assign a subject to an
 * experiment variant. Works with no credentials; persists the assignment when
 * the database is activated.
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
  const { status, body: out } = await handleAssignExperiment(body);
  return NextResponse.json(out, { status });
}
