'use client';

import { useEffect, useState } from 'react';

/**
 * FP-3 — the "war-room entrance". A brief, once-per-session, skippable cinematic
 * overlay before the score tool, so the magic moment has a sense of occasion.
 * CSS-first (no animation lib), reduced-motion users skip it instantly, and a
 * failsafe timer guarantees it always dismisses (never traps the user). Renders
 * nothing after dismissal.
 */
const SEEN_KEY = 'cs_intro_seen';
const DURATION_MS = 2100;

export function WarRoomIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* storage blocked → treat as seen (skip) */
      seen = true;
    }
    const reduce =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce) return;

    setShow(true);
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => setShow(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070510] animate-fade-up"
      role="status"
      aria-label="Preparing your war room"
      onClick={() => setShow(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 h-64 bg-[url('/assets/generated/hero-aura-bg.webp')] bg-cover bg-center opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <p className="text-3xl font-extrabold tracking-tight text-violet-gradient">
        CoachScore
      </p>
      <p className="mt-3 animate-pulse text-sm uppercase tracking-[0.3em] text-brand-gold/80">
        Entering the war room…
      </p>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="absolute bottom-10 text-xs text-[var(--muted)] underline hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}
