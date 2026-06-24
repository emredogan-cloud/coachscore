import { NextResponse } from 'next/server';
import { handleClaimReferral } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST /api/referrals/claim — claim a referral code (records a pending referral). */
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
  const { status, body: out } = await handleClaimReferral(body);
  return NextResponse.json(out, { status });
}
