import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** Grade → band color (matches the on-site grade scale: S gold … E red). */
function gradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case 'S':
      return '#e8b339';
    case 'A':
      return '#4ade80';
    case 'B':
      return '#a3e635';
    case 'C':
      return '#facc15';
    case 'D':
      return '#fb923c';
    case 'E':
    case 'F':
      return '#f87171';
    default:
      return '#a855f7';
  }
}

/**
 * GET /api/share/og?grade=A&overall=85&th=14&goal=war — render a 1200×630 social
 * share card (OG image), on-brand (Phase 1): near-black violet base, gold
 * CoachScore wordmark + shield mark, grade colored by its band. No credential.
 */
export function GET(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade') ?? '?';
  const overall = searchParams.get('overall') ?? '0';
  const townHall = searchParams.get('th') ?? '';
  const goal = searchParams.get('goal') ?? 'rate';
  const gc = gradeColor(grade);

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(60% 50% at 30% 0%, rgba(124,58,237,0.35), transparent 70%), radial-gradient(50% 40% at 100% 100%, rgba(232,179,57,0.14), transparent 70%), #070510',
        color: '#f5f3ff',
        padding: 72,
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Brand row: shield mark + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="68" height="68" viewBox="0 0 512 512">
          <path
            d="M256 60 C300 60 360 72 404 92 C414 96 420 104 420 116 C420 250 400 360 256 456 C112 360 92 250 92 116 C92 104 98 96 108 92 C152 72 212 60 256 60 Z"
            fill="#e8b339"
          />
          <path
            d="M256 96 C294 96 346 106 384 123 C392 127 397 133 397 143 C397 252 380 346 256 416 C132 346 115 252 115 143 C115 133 120 127 128 123 C166 106 218 96 256 96 Z"
            fill="#4c1d95"
          />
          <g fill="#f0c24a">
            <path d="M256 168 L332 234 L332 272 L256 206 L180 272 L180 234 Z" />
            <path d="M256 242 L332 308 L332 346 L256 280 L180 346 L180 308 Z" />
          </g>
        </svg>
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700 }}>
          <span style={{ color: '#f5f3ff' }}>Coach</span>
          <span style={{ color: '#a855f7' }}>Score</span>
        </div>
      </div>

      {/* Grade + score */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 200,
            fontWeight: 800,
            lineHeight: 1,
            color: gc,
          }}
        >
          {grade}
        </div>
        <div style={{ display: 'flex', fontSize: 52, marginTop: 8 }}>
          {overall}/100{townHall ? ` · Town Hall ${townHall}` : ''}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#a39db8',
            marginTop: 6,
          }}
        >
          goal: {goal}
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: 22, color: '#8b85a0' }}>
        Objective score + upgrade roadmap · unofficial, not endorsed by
        Supercell
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
