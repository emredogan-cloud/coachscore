'use client';

import { useEffect, useState } from 'react';
import { ScoreRing } from '@/components/ui';

/**
 * FP-2 — the first-5-seconds hook. Shows the product's value *in motion* before
 * any click: an example score ring fills and counts up to a grade on load, so a
 * visitor instantly grasps "I paste my tag, I get this." Illustrative only
 * (clearly labelled, not a real account). Reduced-motion users see the final
 * state immediately. CSS-free JS tween (rAF) — tiny, no animation library.
 */
const TARGET = 74; // an illustrative "B"

export function DemoScore() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(TARGET);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const duration = 1400;
    const tick = (now: number) => {
      if (startTs === 0) startTs = now;
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out ≈ the "settle" curve
      setValue(Math.round(eased * TARGET));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const done = value >= TARGET;
  return (
    <div className="flex flex-col items-center">
      <ScoreRing
        value={value}
        grade={done ? 'B' : undefined}
        size={156}
        label="Example CoachScore"
      />
      <p className="mt-3 text-center text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        Example grade · your real one in ~30s
      </p>
    </div>
  );
}
