import { NextResponse } from 'next/server';
import { healthReport } from '@/lib/observability';

export const dynamic = 'force-dynamic';

/**
 * Liveness/readiness probe (Phase 9). Used by uptime monitoring + CI smoke
 * checks. Returns 200 with the activation matrix (which credential-gated
 * subsystems are live) + observability wiring; never touches secret values.
 */
export function GET() {
  return NextResponse.json({
    service: 'coachscore',
    timestamp: new Date().toISOString(),
    ...healthReport(),
  });
}
