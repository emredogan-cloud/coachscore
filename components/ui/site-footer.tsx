import Link from 'next/link';
import { SUPERCELL_DISCLAIMER } from '@/lib/env';
import { BrandMark } from './brand-mark';

const LINKS: readonly { label: string; href: string }[] = [
  { label: 'Methodology', href: '/methodology' },
  { label: 'Editorial standards', href: '/editorial-standards' },
  { label: 'Transparency', href: '/transparency' },
  { label: 'Guides', href: '/guides' },
  { label: 'Pricing', href: '/pricing' },
];

/**
 * Global site footer (Phase 2) — brand lockup + tagline, the standards/legal
 * link row, copyright, and the mandatory Supercell fan-content disclaimer.
 * Pure + server-rendered.
 */
export function SiteFooter() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <BrandMark />
          <p className="mt-3 text-sm text-[var(--muted)]">
            AI-powered Clash of Clans coaching — objective scores and a
            prioritized upgrade roadmap to help you upgrade smarter.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[var(--muted)] transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8 border-t border-white/8 pt-5 text-center text-xs text-[var(--muted)]">
        <p>© 2026 CoachScore. All rights reserved.</p>
        <p className="mx-auto mt-2 max-w-2xl">{SUPERCELL_DISCLAIMER}</p>
      </div>
    </div>
  );
}
