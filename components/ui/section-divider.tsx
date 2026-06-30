import type { ReactNode } from 'react';

/**
 * Premium section divider (Phase 2) — a gold, uppercase, letter-spaced label
 * flanked by gem ornaments and fading gold rules. Matches the
 * `◇— SECTION —◇` motif used throughout /interface/new. Pure + server-rendered.
 */
function Gem() {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-gradient-to-br from-brand-gold-light to-brand-gold shadow-glow-gold-sm"
    />
  );
}

export function SectionDivider({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-full max-w-[120px] bg-gradient-to-r from-transparent to-brand-gold/45" />
      <Gem />
      <span className="whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">
        {children}
      </span>
      <Gem />
      <span className="h-px w-full max-w-[120px] bg-gradient-to-l from-transparent to-brand-gold/45" />
    </div>
  );
}
