import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/share/og?grade=A&overall=85&th=14&goal=war — render a 1200×630 social
 * share card (OG image). No credential needed.
 */
export function GET(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade') ?? '?';
  const overall = searchParams.get('overall') ?? '0';
  const townHall = searchParams.get('th') ?? '';
  const goal = searchParams.get('goal') ?? 'rate';

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        color: '#ffffff',
        padding: 64,
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 36, opacity: 0.85 }}>
        CoachScore
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 180, fontWeight: 700 }}>
          {grade}
        </div>
        <div style={{ display: 'flex', fontSize: 48 }}>
          {overall}/100 · Town Hall {townHall}
        </div>
        <div
          style={{ display: 'flex', fontSize: 30, opacity: 0.7, marginTop: 8 }}
        >
          goal: {goal}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 22, opacity: 0.6 }}>
        Rate my account + upgrade roadmap · unofficial, not endorsed by
        Supercell
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
