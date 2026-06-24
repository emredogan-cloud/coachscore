import Image from 'next/image';
import type { ReactNode } from 'react';

/**
 * Hero banner — the brand crest + wordmark + tagline over the aurora glow (the
 * artwork's top section). Hook-free + server-rendered.
 *
 * SEO: when a `headline` is supplied the keyword-rich headline becomes the page
 * <h1> and the brand wordmark demotes to an eyebrow <p> (roadmap §9.5 — the H1
 * must carry the search intent, not just the brand name). With no `headline`
 * the wordmark stays the <h1> (back-compat).
 *
 * `crest` renders the premium generated emblem (`hero-crest.webp`, transparent,
 * 56KB) above the wordmark with a soft glow — the centerpiece of the dark
 * violet+gold "battle" identity. Fixed dimensions → no layout shift.
 */
export function HeroBanner({
  headline,
  tagline,
  crest = false,
  children,
}: {
  headline?: string;
  tagline?: string;
  crest?: boolean;
  children?: ReactNode;
}) {
  const Wordmark: 'p' | 'h1' = headline ? 'p' : 'h1';
  return (
    <header className="relative text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-brand-violet/25 blur-3xl"
      />
      {crest ? (
        <div className="relative mx-auto mb-3 flex h-[120px] w-[120px] items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-brand-gold/20 blur-2xl"
          />
          <Image
            src="/assets/generated/hero-crest.webp"
            alt="CoachScore crest"
            width={120}
            height={120}
            priority
            className="relative animate-float drop-shadow-[0_6px_20px_rgba(168,85,247,0.35)]"
          />
        </div>
      ) : null}
      <Wordmark
        className={`wordmark relative font-extrabold tracking-tight ${
          headline ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'
        }`}
      >
        <span className="text-gold-gradient">Coach</span>
        <span className="text-violet-gradient">Score</span>
      </Wordmark>
      {headline ? (
        <h1 className="relative mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          {headline}
        </h1>
      ) : null}
      {tagline ? (
        <p className="relative mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80">
          {tagline}
        </p>
      ) : null}
      {children}
    </header>
  );
}
