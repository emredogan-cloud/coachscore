import type { Metadata } from 'next';
import { HeroBanner, MagicButton, PremiumCard } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Get started — CoachScore',
  description:
    'How CoachScore works: submit your Clash of Clans account, get a scored ' +
    'grade, and receive a prioritized, goal-aware upgrade roadmap.',
};

const STEPS: readonly { n: string; title: string; detail: string }[] = [
  {
    n: '1',
    title: 'Submit your account',
    detail: 'Enter your levels, upload screenshots, or paste your player tag.',
  },
  {
    n: '2',
    title: 'Get scored',
    detail:
      'A deterministic engine grades seven dimensions for the goal you pick.',
  },
  {
    n: '3',
    title: 'Get your roadmap',
    detail:
      'A prioritized, goal-aware upgrade plan — AI-drafted, human-verified.',
  },
];

const GOALS: readonly string[] = [
  'Rate my account',
  'Win wars / CWL',
  'Push trophies',
  'De-rush',
  'Get recruited',
  'Steady progress',
];

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <HeroBanner tagline="How it works" />
      <p className="mt-5 text-center text-[15px] text-[var(--muted)]">
        Stop guessing what to upgrade next — three steps to your roadmap.
      </p>

      <ol className="mt-8 space-y-3">
        {STEPS.map((step) => (
          <PremiumCard key={step.n} tone="violet" className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-gradient text-sm font-bold text-white shadow-glow-violet-sm">
                {step.n}
              </span>
              <div>
                <h2 className="font-semibold text-white">{step.title}</h2>
                <p className="mt-0.5 text-sm text-[var(--muted)]">
                  {step.detail}
                </p>
              </div>
            </div>
          </PremiumCard>
        ))}
      </ol>

      <section className="mt-8" aria-labelledby="goals-heading">
        <h2
          id="goals-heading"
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Pick a goal when you start
        </h2>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {GOALS.map((goal) => (
            <li
              key={goal}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[var(--fg)]/90"
            >
              {goal}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-9 space-y-3">
        <MagicButton href="/report" variant="gold" size="lg">
          Start — score my account
        </MagicButton>
        <MagicButton href="/pricing" variant="ghost" size="lg">
          See pricing
        </MagicButton>
      </div>
    </div>
  );
}
