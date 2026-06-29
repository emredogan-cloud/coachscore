import { NextResponse } from 'next/server';
import { resolveCreatorCode } from '@/lib/growth';
import { parseReferralParam } from '@/lib/referrals';

export const dynamic = 'force-dynamic';

const REF_COOKIE = 'cs_ref';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * GET /r/{code} — the referral landing (PMF-correction sprint, Phase 5).
 *
 * Closes the share → landing → score loop: a shared link lands here, we validate
 * + attribute the referral as a 30-day cookie (read by the checkout flow to
 * qualify the referrer when payments are live), then route the visitor straight
 * into the score flow (paste tag → instant score → share again). An invalid or
 * missing code simply routes to the score page — no dead end.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await params;
  // Accept a per-user referral code OR a registered creator vanity code.
  const referral = parseReferralParam(code);
  const attributed = referral ?? resolveCreatorCode(code)?.code ?? null;
  const dest = new URL(
    attributed ? '/report?invited=1' : '/report',
    request.url,
  );
  const res = NextResponse.redirect(dest);
  if (attributed) {
    res.cookies.set(REF_COOKIE, attributed, {
      path: '/',
      maxAge: THIRTY_DAYS,
      sameSite: 'lax',
      httpOnly: true,
    });
  }
  return res;
}
