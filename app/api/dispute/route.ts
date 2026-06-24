import { NextResponse } from 'next/server';
import { handleRaiseDispute } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST /api/dispute — raise a dispute. 503 until the database is activated. */
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
  const { status, body: out } = await handleRaiseDispute(body);
  return NextResponse.json(out, { status });
}
