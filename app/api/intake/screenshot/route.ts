import { NextResponse } from 'next/server';
import { handleScreenshotIntake } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/intake/screenshot — extract an account from base64 screenshot(s)
 * via the OCR pipeline, then score it. Returns 503 not_activated until
 * ANTHROPIC_API_KEY is set. Body: { goal, townHall, context?, clan?,
 * corrections?, images: [{ mediaType, dataBase64 }] }.
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
  const { status, body: out } = await handleScreenshotIntake(body);
  return NextResponse.json(out, { status });
}
