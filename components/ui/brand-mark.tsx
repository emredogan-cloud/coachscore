import Link from 'next/link';

/**
 * CoachScore brand lockup (Phase 2) — the chevron shield mark + wordmark.
 * Mirrors public/icon.svg (solid fills for crisp small sizes). Used by the nav
 * and footer. Renders as a home link unless `href={null}`.
 */
export function BrandMark({
  size = 34,
  href = '/' as string | null,
  showWordmark = true,
  className = '',
}: {
  size?: number;
  href?: string | null;
  showWordmark?: boolean;
  className?: string;
}) {
  const mark = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        aria-hidden
        role="img"
      >
        <path
          d="M256 60 C300 60 360 72 404 92 C414 96 420 104 420 116 C420 250 400 360 256 456 C112 360 92 250 92 116 C92 104 98 96 108 92 C152 72 212 60 256 60 Z"
          fill="#e8b339"
        />
        <path
          d="M256 96 C294 96 346 106 384 123 C392 127 397 133 397 143 C397 252 380 346 256 416 C132 346 115 252 115 143 C115 133 120 127 128 123 C166 106 218 96 256 96 Z"
          fill="#4c1d95"
        />
        <g fill="#f5d272">
          <path d="M256 168 L332 234 L332 272 L256 206 L180 272 L180 234 Z" />
          <path d="M256 242 L332 308 L332 346 L256 280 L180 346 L180 308 Z" />
        </g>
      </svg>
      {showWordmark ? (
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-white">Coach</span>
          <span className="text-brand-violet-light">Score</span>
        </span>
      ) : null}
    </span>
  );
  return href ? (
    <Link href={href} aria-label="CoachScore home" className="inline-flex">
      {mark}
    </Link>
  ) : (
    mark
  );
}
