import { NextResponse } from 'next/server';
import { handleReportPdf } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/report/pdf — render a deterministic PDF of the report for a manual
 * intake body. No credential needed (pdf-lib runs in-process).
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'validation_error', message: 'Invalid JSON body.' } },
      { status: 422 },
    );
  }
  const result = await handleReportPdf(body);
  if (result.pdf === undefined) {
    return NextResponse.json(result.body, { status: result.status });
  }
  const pdf = result.pdf;
  const arrayBuffer = pdf.buffer.slice(
    pdf.byteOffset,
    pdf.byteOffset + pdf.byteLength,
  ) as ArrayBuffer;
  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="coachscore-report.pdf"',
    },
  });
}
