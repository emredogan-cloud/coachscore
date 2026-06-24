import { GRADE_BANDS } from '@/lib/core/grade';
import { HeroBanner, MagicButton, PremiumCard } from '@/components/ui';

/**
 * Landing page — premium "battle" theme (Phase B). Brand hero, the grade scale
 * as glowing shield cards, the value pillars, and the primary CTA into the
 * teaser funnel. Server-rendered, mobile-first.
 */

const GRADE_COLOR: Record<string, string> = {
  S: '#f5d272',
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

const PILLARS = [
  { label: 'Detailed analysis', d: 'M4 19V5m5 14V9m5 10V3m5 16v-8' },
  {
    label: 'Expert evaluation',
    d: 'M12 3l7 3v6c0 4-3 6-7 9-4-3-7-5-7-9V6l7-3z',
  },
  {
    label: 'Fair & accurate',
    d: 'M12 3v18M5 7l7-3 7 3M5 7l-2 6h4l-2-6zm14 0l-2 6h4l-2-6z',
  },
  {
    label: 'Improve & dominate',
    d: 'M3 21l6-6m12-12l-6 6M9 9l6 6m-9 3l-3-3 3-3',
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <HeroBanner tagline="Expert Clash of Clans account rating" />

      <p className="mt-6 text-center text-[15px] leading-relaxed text-[var(--muted)]">
        Stop guessing what to upgrade next. Get your account scored and receive
        a prioritized, goal-aware upgrade roadmap —{' '}
        <span className="text-white">
          AI-drafted, verified by a real coach.
        </span>
      </p>

      {/* Grade scale — shield cards */}
      <section className="mt-9" aria-labelledby="grades-heading">
        <h2
          id="grades-heading"
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          The CoachScore grade scale
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {GRADE_BANDS.map((band) => {
            const color = GRADE_COLOR[band.grade] ?? '#a855f7';
            const featured = band.grade === 'S';
            return (
              <PremiumCard
                key={band.grade}
                tone={featured ? 'gold' : 'violet'}
                glowed={featured}
                className={`flex flex-col items-center justify-center py-4 ${
                  featured ? 'col-span-3 py-6' : ''
                }`}
              >
                <span
                  className={`font-extrabold leading-none ${featured ? 'text-5xl' : 'text-3xl'}`}
                  style={{ color, textShadow: `0 0 22px ${color}55` }}
                >
                  {band.grade}
                </span>
                <span className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                  {band.min}
                  {band.max === 100 ? '+' : `–${band.max}`}
                </span>
              </PremiumCard>
            );
          })}
        </div>
      </section>

      {/* Value pillars */}
      <section
        className="mt-8 grid grid-cols-4 gap-2"
        aria-label="What you get"
      >
        {PILLARS.map((p) => (
          <div key={p.label} className="flex flex-col items-center text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-brand-violet-light"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={p.d} />
              </svg>
            </span>
            <span className="mt-1.5 text-[10px] font-medium leading-tight text-[var(--muted)]">
              {p.label}
            </span>
          </div>
        ))}
      </section>

      {/* CTA */}
      <div className="mt-9 space-y-3">
        <MagicButton href="/onboarding" variant="gold" size="lg">
          Score your account
        </MagicButton>
        <div className="flex gap-3">
          <MagicButton href="/pricing" variant="ghost" className="flex-1">
            See pricing
          </MagicButton>
          <MagicButton href="/products" variant="ghost" className="flex-1">
            Specialized tools
          </MagicButton>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Free instant score · no account required · AI-drafted, human-verified.
      </p>
    </div>
  );
}
