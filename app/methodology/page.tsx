import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import { ScoreBreakdown } from '@/components/score-breakdown';
import {
  EyebrowPill,
  GradeBadge,
  MagicButton,
  PremiumCard,
  SectionDivider,
  TrustBar,
  type TrustItem,
} from '@/components/ui';
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

/** Abstract, IP-safe line emblems (no game art) for each scored dimension. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const DIMENSION_ICONS: Record<SubScoreKey, ReactNode> = {
  heroes: (
    <Icon>
      <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z" />
    </Icon>
  ),
  offense: (
    <Icon>
      <path d="M13 2L3 14h7l-1 8 11-13h-7l0-7z" />
    </Icon>
  ),
  defense: (
    <Icon>
      <path d="M12 3l7 3v6c0 4-3 6-7 9-4-3-7-5-7-9V6l7-3z" />
    </Icon>
  ),
  equipment: (
    <Icon>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </Icon>
  ),
  progression: (
    <Icon>
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M16 8h4v4" />
    </Icon>
  ),
  walls: (
    <Icon>
      <path d="M3 9h18M3 15h18M7 4v5M12 4v5M17 4v5M9 15v5M15 15v5" />
    </Icon>
  ),
  clanValue: (
    <Icon>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 7a3 3 0 0 1 0 5M18 20a6 6 0 0 0-3-5" />
    </Icon>
  ),
};

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

const TRUST_ITEMS: readonly TrustItem[] = [
  {
    title: 'Deterministic',
    subtitle: 'Same inputs, same score',
    icon: (
      <Icon>
        <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
        <path d="M18 3v3.5h-3.5M6 21v-3.5h3.5" />
      </Icon>
    ),
  },
  {
    title: 'Public methodology',
    subtitle: 'Nothing hidden',
    icon: (
      <Icon>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </Icon>
    ),
  },
  {
    title: 'Goal-aware',
    subtitle: 'Re-weighted for your aim',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.5" />
      </Icon>
    ),
  },
  {
    title: 'Flagged data',
    subtitle: 'Unverified marked, never faked',
    icon: (
      <Icon>
        <path d="M5 21V4l9 2 5-1v9l-5 1-9-2z" />
      </Icon>
    ),
  },
];

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
    <article className="mx-auto max-w-3xl px-4 py-10">
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

      <header className="mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          How <span className="text-violet-gradient">CoachScore</span> grades an
          account
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <EyebrowPill tone="violet">Engine v{ENGINE_VERSION}</EyebrowPill>
          <EyebrowPill>Data {gameDataVersion()}</EyebrowPill>
          <EyebrowPill tone="violet">
            Updated {freshnessLabel(CONTENT_REVISION_DATE)}
          </EyebrowPill>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">
          CoachScore turns a Clash of Clans account into a single grade and a
          prioritized upgrade roadmap. The grade is produced by a transparent,
          deterministic engine — the same inputs always produce the same score —
          and the written roadmap is AI-drafted from your real in-game numbers.
        </p>
      </header>

      <SectionDivider className="mt-12">
        The seven scored dimensions
      </SectionDivider>
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-[var(--muted)]">
        Each dimension is your completion vs. the maxed baseline for your Town
        Hall. The percentages below are the default “steady progress” weights at
        TH16+; they shift with your goal (see below).
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <PremiumCard tone="violet" glowed className="p-5 sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
            Default weights · TH16+
          </h2>
          <div className="mt-4">
            <ScoreBreakdown />
          </div>
        </PremiumCard>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
          {DIMENSIONS.map((d) => (
            <PremiumCard key={d.key} tone="plain" className="p-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 font-semibold text-white">
                  <span className="text-brand-violet-light">
                    {DIMENSION_ICONS[d.key]}
                  </span>
                  {d.label}
                </dt>
                <span className="text-sm font-bold text-gold-gradient tabular-nums">
                  {weightPct(d.key)}%
                </span>
              </div>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {d.desc}
              </dd>
            </PremiumCard>
          ))}
        </dl>
      </div>

      <PremiumCard tone="gold" className="mt-6 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-brand-gold">
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01M11 12h1v4h1" />
            </Icon>
          </span>
          <p className="text-sm leading-relaxed text-[var(--fg)]/90">
            <span className="font-semibold text-white">
              Weights change based on your goal.
            </span>{' '}
            A war roster and a trophy push are graded differently — CoachScore
            re-weights every dimension for the goal you pick. Hero equipment is
            only scored from Town Hall {16}; below it, that weight is
            redistributed across the other dimensions.
          </p>
        </div>
      </PremiumCard>

      <SectionDivider className="mt-12">Goal-aware weighting</SectionDivider>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">
        There is no single “best” account — it depends on what you are playing
        for. Pick the goal that matches how you play and the engine re-weights
        the seven dimensions to match.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {ALL_GOALS.map((g) => (
          <li key={g}>
            <EyebrowPill tone="violet">{GOAL_LABELS[g]}</EyebrowPill>
          </li>
        ))}
      </ul>

      <SectionDivider className="mt-12">The F–S grade scale</SectionDivider>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">
        Your weighted total maps to a single letter grade — from a rushed F to a
        near-maxed S.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {GRADE_BANDS.map((band) => (
          <PremiumCard
            key={band.grade}
            tone="plain"
            className="flex flex-col items-center gap-2 p-3 text-center"
          >
            <GradeBadge grade={band.grade} size="sm" />
            <span className="text-[11px] font-medium text-[var(--muted)] tabular-nums">
              {band.min}
              {band.max === 100 ? '+' : `–${band.max}`}
            </span>
          </PremiumCard>
        ))}
      </div>

      <SectionDivider className="mt-12">
        AI-drafted from your data
      </SectionDivider>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">
        The score is deterministic; the roadmap prose is drafted by AI from your
        real in-game numbers. Town Hall caps come from a versioned reference
        table: verified values are sourced, and best-effort values are
        explicitly flagged for verification rather than presented as certain.
        See our{' '}
        <Link
          href="/editorial-standards"
          className="text-brand-violet-light underline-offset-2 hover:text-white hover:underline"
        >
          editorial standards
        </Link>{' '}
        and{' '}
        <Link
          href="/transparency"
          className="text-brand-violet-light underline-offset-2 hover:text-white hover:underline"
        >
          transparency page
        </Link>
        .
      </p>

      <TrustBar items={TRUST_ITEMS} className="mt-6" />

      <SectionDivider className="mt-12">FAQ</SectionDivider>
      <dl className="mt-5 space-y-3">
        {FAQS.map((faq) => (
          <PremiumCard key={faq.question} tone="plain" className="p-4">
            <dt className="font-semibold text-white">{faq.question}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              {faq.answer}
            </dd>
          </PremiumCard>
        ))}
      </dl>

      <PremiumCard tone="gold" glowed className="mt-12 p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          See your own grade across all seven dimensions — free.
        </h2>
        <div className="mt-5">
          <MagicButton href="/report" variant="gold">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>

      <nav className="mt-10 border-t border-white/8 pt-6 text-sm">
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
