import { NextResponse } from 'next/server';
import { handleTagIntake } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/intake/tag — score an account by Clash of Clans player tag. Returns
 * 503 not_activated until the CoC API proxy credentials are provisioned; the tag
 * is still validated (422 on a malformed tag).
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
  const { status, body: out } = await handleTagIntake(body);
  return NextResponse.json(out, { status });
}
