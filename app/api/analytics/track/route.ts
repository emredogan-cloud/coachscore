import { NextResponse } from 'next/server';
import { handleTrackEvent } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/track — capture a taxonomy event. Works with no
 * credentials (forwards to a no-op sink + skips persistence); forwards to
 * PostHog when configured and persists when the database is activated.
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
  const { status, body: out } = await handleTrackEvent(body);
  return NextResponse.json(out, { status });
}
