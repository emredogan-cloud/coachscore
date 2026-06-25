'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animated value count-up (immersion sprint · Section 8 — "count animations").
 * The one justified client island in the motion system: eases a number from 0
 * to `to` on mount (cubic ease-out). Honors `prefers-reduced-motion` (jumps
 * straight to the value). Use for the score reveal.
 */
export function CountUp({
  to,
  durationMs = 900,
  className = '',
  suffix = '',
}: {
  to: number;
  durationMs?: number;
  className?: string;
  suffix?: string;
}) {
  const [n, setN] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) {
      setN(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * to));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [to, durationMs]);

  return (
    <span className={className}>
      {n}
      {suffix}
    </span>
  );
}
