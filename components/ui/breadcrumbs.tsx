import Link from 'next/link';

export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

/**
 * Breadcrumb trail (Phase 2) — "Home › Section". The last crumb is the current
 * page (violet, no link). Pure + server-rendered + a11y nav landmark.
 */
export function Breadcrumbs({
  items,
  className = '',
}: {
  items: readonly Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-2 text-sm ${className}`}
    >
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-2">
            {c.href && !last ? (
              <Link
                href={c.href}
                className="text-[var(--muted)] transition hover:text-white"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={
                  last ? 'text-brand-violet-light' : 'text-[var(--muted)]'
                }
              >
                {c.label}
              </span>
            )}
            {!last ? (
              <span aria-hidden className="text-[var(--muted)]/60">
                ›
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
