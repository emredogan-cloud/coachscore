import type { ReactNode } from 'react';

/**
 * Hero banner — the brand wordmark + tagline over the aurora glow (the artwork's
 * top section). Hook-free + server-rendered.
 */
export function HeroBanner({
  tagline,
  children,
}: {
  tagline?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-brand-violet/25 blur-3xl"
      />
      <h1 className="wordmark relative text-4xl font-extrabold tracking-tight sm:text-5xl">
        <span className="text-gold-gradient">Coach</span>
        <span className="text-violet-gradient">Score</span>
      </h1>
      {tagline ? (
        <p className="relative mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80">
          {tagline}
        </p>
      ) : null}
      {children}
    </header>
  );
}
