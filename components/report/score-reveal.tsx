'use client';

import { useEffect, useState } from 'react';
import { ScoreRing } from '@/components/ui';

/**
 * EMO-P0 — the score reveal as a moment. The real score ring fills + counts up
 * on the "settle" curve, and a CSS confetti burst fires once for a top grade
 * (A or S). No animation library (CSS-first, CWV-safe); reduced-motion users get
 * the final state instantly and no burst. Pairs with `<TeaserView>`.
 */
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = 54;
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
    gold: i % 2 === 0,
  };
});

export function ScoreReveal({
  value,
  grade,
  size = 108,
  label = 'Your score',
}: {
  value: number;
  grade: string;
  size?: number;
  label?: string;
}) {
  const [shown, setShown] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const top = grade === 'A' || grade === 'S';

  useEffect(() => {
    const reduce =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const duration = 1100;
    const tick = (now: number) => {
      if (start === 0) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
      else if (top) setCelebrate(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, top]);

  const done = shown >= value;
  return (
    <div className="relative inline-flex items-center justify-center">
      <ScoreRing
        value={shown}
        grade={done ? grade : undefined}
        size={size}
        label={label}
      />
      {celebrate ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          {BURST.map((p, i) => (
            <span
              key={i}
              className={`absolute h-1.5 w-1.5 rounded-full animate-celebrate ${p.gold ? 'bg-brand-gold' : 'bg-brand-violet-light'}`}
              style={
                {
                  '--tx': `${p.tx}px`,
                  '--ty': `${p.ty}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
