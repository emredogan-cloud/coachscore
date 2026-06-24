import { NextResponse } from 'next/server';
import { handleGrowthDashboard } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/growth/dashboard — aggregated funnel / experiment / referral metrics.
 * Returns 503 not_activated until the database + admin auth are provisioned.
 */
export async function GET(): Promise<NextResponse> {
  const { status, body: out } = await handleGrowthDashboard();
  return NextResponse.json(out, { status });
}
