import { NextResponse } from 'next/server';
import { handleCreateReferralCode, handleMyReferrals } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST /api/referrals — get-or-create the caller's referral code. */
export async function POST(): Promise<NextResponse> {
  const { status, body: out } = await handleCreateReferralCode();
  return NextResponse.json(out, { status });
}

/** GET /api/referrals — the caller's code + referral stats. */
export async function GET(): Promise<NextResponse> {
  const { status, body: out } = await handleMyReferrals();
  return NextResponse.json(out, { status });
}
