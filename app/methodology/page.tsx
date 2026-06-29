import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { MagicButton, PremiumCard } from '@/components/ui';
import {
  ALL_GOALS,
  ENGINE_VERSION,
  GRADE_BANDS,
  WEIGHT_PROFILES,
  type Goal,
  type SubScoreKey,
} from '@/lib/core';
import {
  articleJsonLd,
  buildMetadata,
  canonicalUrl,
  CONTENT_REVISION_DATE,
  faqJsonLd,
  freshnessLabel,
  gameDataVersion,
  type FaqEntry,
} from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'How CoachScore grades a Clash of Clans account (methodology)',
  description:
    'The transparent, deterministic methodology behind CoachScore: seven scored ' +
    'dimensions, goal-aware weighting, rush detection, and the F–S grade scale.',
  path: '/methodology',
  type: 'article',
});

const DIMENSIONS: readonly {
  key: SubScoreKey;
  label: string;
  desc: string;
}[] = [
  {
    key: 'heroes',
    label: 'Heroes',
    desc: 'King, Queen, Warden, Champion, Minion Prince and Dragon Duke levels vs. the cap for your Town Hall, weighted by Dark-Elixir cost.',
  },
  {
    key: 'offense',
    label: 'Offense',
    desc: 'Troop, spell and siege levels behind your main attack, weighted by lab time.',
  },
  {
    key: 'defense',
    label: 'Defense',
    desc: 'Key defensive buildings vs. the maxed baseline for your Town Hall.',
  },
  {
    key: 'equipment',
    label: 'Hero equipment',
    desc: 'Epic equipment behind your real army — scored from TH16, redistributed below it.',
  },
  {
    key: 'progression',
    label: 'Progression (rush)',
    desc: 'How far your base lags the maxed baseline of the previous Town Hall — the rush signal.',
  },
  {
    key: 'walls',
    label: 'Walls',
    desc: 'Wall levels — cheap grade once heroes and defenses are in range.',
  },
  {
    key: 'clanValue',
    label: 'Clan value',
    desc: 'Clan-level contributions to overall account strength.',
  },
];

const GOAL_LABELS: Record<Goal, string> = {
  progress: 'Steady progress',
  war: 'War / CWL',
  trophy: 'Trophy push',
  derush: 'De-rush',
  recruit: 'Get recruited',
  rate: 'Just rate it',
};

const FAQS: readonly FaqEntry[] = [
  {
    question: 'Is the CoachScore grade deterministic?',
    answer:
      'Yes. The same account inputs and goal always produce the same score — there is no randomness. The AI drafts the written roadmap, but the grade itself comes from a fixed, auditable engine.',
  },
  {
    question: 'How does CoachScore measure if an account is rushed?',
    answer:
      'The Progression dimension compares your base to the maxed baseline of the previous Town Hall. The further your heroes, defenses and offense lag that baseline for your current Town Hall, the more rushed the account.',
  },
  {
    question: 'Are the game-data values official?',
    answer:
      'No. CoachScore uses a versioned reference table of Town Hall caps. Some values are verified against an authoritative source and some are best-effort and flagged for verification — we never present an unverified value as certain.',
  },
];

export default function MethodologyPage() {
  const defaultWeights = WEIGHT_PROFILES.progress.th16plus;
  const weightPct = (k: SubScoreKey): number =>
    Math.round((defaultWeights[k] ?? 0) * 100);

  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript
        data={[
          articleJsonLd({
            headline: 'How CoachScore grades a Clash of Clans account',
            description: metadata.description as string,
            url: canonicalUrl('/methodology'),
            dateModified: CONTENT_REVISION_DATE,
          }),
          faqJsonLd(FAQS),
        ]}
      />
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Methodology', href: '/methodology' },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        How CoachScore grades an account
      </h1>
      <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Engine v{ENGINE_VERSION} · data {gameDataVersion()} · updated{' '}
        {freshnessLabel(CONTENT_REVISION_DATE)}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        CoachScore turns a Clash of Clans account into a single grade and a
        prioritized upgrade roadmap. The grade is produced by a transparent,
        deterministic engine — the same inputs always produce the same score —
        and the written roadmap is AI-drafted from your real in-game numbers.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">
          The seven scored dimensions
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Each dimension is your completion vs. the maxed baseline for your Town
          Hall. The percentages below are the default “steady progress” weights
          at TH16+; they shift with your goal (see next section).
        </p>
        <PremiumCard tone="violet" className="mt-4 p-4">
          <ScoreBreakdown />
        </PremiumCard>
        <dl className="mt-6 space-y-3">
          {DIMENSIONS.map((d) => (
            <PremiumCard key={d.key} tone="plain" className="p-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-semibold text-white">{d.label}</dt>
                <span className="text-sm font-bold text-gold-gradient">
                  {weightPct(d.key)}%
                </span>
              </div>
              <dd className="mt-1 text-sm text-[var(--muted)]">{d.desc}</dd>
            </PremiumCard>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">
          Goal-aware weighting
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          There is no single “best” account — it depends on what you are playing
          for. CoachScore re-weights the dimensions for the goal you pick, so a
          war roster and a trophy push are graded differently. Hero equipment is
          only scored from Town Hall {16}; below it, that weight is
          redistributed across the other dimensions.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ALL_GOALS.map((g) => (
            <li
              key={g}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[var(--fg)]/90"
            >
              {GOAL_LABELS[g]}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">
          The F–S grade scale
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {GRADE_BANDS.map((band) => (
            <div
              key={band.grade}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center"
            >
              <span className="text-lg font-extrabold text-white">
                {band.grade}
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                {band.min}
                {band.max === 100 ? '+' : `–${band.max}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">
          AI-drafted from your data — and honest about it
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          The score is deterministic; the roadmap prose is drafted by AI from
          your real in-game numbers. Town Hall caps come from a versioned
          reference table: verified values are sourced, and best-effort values
          are explicitly flagged for verification rather than presented as
          certain. See our{' '}
          <Link
            href="/editorial-standards"
            className="text-brand-violet-light hover:text-white"
          >
            editorial standards
          </Link>{' '}
          and{' '}
          <Link
            href="/transparency"
            className="text-brand-violet-light hover:text-white"
          >
            transparency page
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">FAQ</h2>
        <dl className="mt-3 space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium text-[var(--fg)]/90">
                {faq.question}
              </dt>
              <dd className="mt-1 text-sm text-[var(--muted)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <PremiumCard tone="gold" glowed className="mt-9 p-5 text-center">
        <p className="font-medium text-white">
          See your own grade across all seven dimensions — free.
        </p>
        <div className="mt-3">
          <MagicButton href="/report" variant="gold">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>

      <nav className="mt-9 border-t border-white/10 pt-5 text-sm">
        <Link
          href="/sample-report"
          className="text-brand-violet-light hover:text-white"
        >
          See a sample report →
        </Link>
      </nav>
    </article>
  );
}
