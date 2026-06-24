import { NextResponse } from 'next/server';
import { handleProductReport } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/report/[id] — fetch a persisted product report the caller is
 * allowed to read. Returns 503 not_activated until the database is provisioned,
 * and 404 not_found when the report is missing or not visible to the caller.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const { status, body: out } = await handleProductReport(id);
  return NextResponse.json(out, { status });
}
