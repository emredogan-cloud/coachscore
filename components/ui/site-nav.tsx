'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BrandMark } from './brand-mark';

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

const DEFAULT_LINKS: readonly NavLink[] = [
  { label: 'Analyze', href: '/intake' },
  { label: 'War', href: '/war' },
  { label: 'Guides', href: '/guides' },
  { label: 'Methodology', href: '/methodology' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/**
 * Global top navigation (Phase 2) — brand lockup, primary links with an active
 * underline, and a gold "Premium" pill. Collapses to a menu button on mobile.
 * Client component (active route + menu toggle).
 */
export function SiteNav({
  links = DEFAULT_LINKS,
}: {
  links?: readonly NavLink[];
}) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-ink-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <BrandMark />

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative text-sm font-semibold transition ${
                    active
                      ? 'text-white'
                      : 'text-[var(--muted)] hover:text-white'
                  }`}
                >
                  {l.label}
                  {active ? (
                    <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-violet-gradient" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/45 px-3.5 py-1.5 text-sm font-bold text-brand-gold transition hover:shadow-glow-gold-sm"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 7l4 3 5-6 5 6 4-3-2 12H5L3 7z" />
            </svg>
            Premium
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              {open ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open ? (
        <ul className="flex flex-col gap-1 border-t border-white/8 px-4 py-2 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
                  isActive(pathname, l.href)
                    ? 'bg-white/5 text-white'
                    : 'text-[var(--muted)] hover:bg-white/5 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
