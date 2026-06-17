import { NextResponse } from 'next/server';
import { appConfig } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Liveness/readiness probe. Used by uptime monitoring and CI smoke checks.
 * Returns 200 with build/runtime metadata; never touches secrets.
 */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'coachscore',
    env: appConfig.env,
    timestamp: new Date().toISOString(),
  });
}
