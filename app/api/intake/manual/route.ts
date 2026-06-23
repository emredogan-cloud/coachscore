import { NextResponse } from 'next/server';
import { handleManualIntake } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/intake/manual — score a manually entered account. Works with no
 * credentials (the score is computed in-process); persistence is attempted only
 * when the database is activated.
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
  const { status, body: out } = await handleManualIntake(body);
  return NextResponse.json(out, { status });
}
