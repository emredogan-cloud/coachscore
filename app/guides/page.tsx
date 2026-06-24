import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { PremiumCard } from '@/components/ui';
import {
  buildMetadata,
  guidesByPillar,
  SEO_GUIDES,
  type SeoGuide,
  type SeoPillar,
} from '@/lib/seo';

// ISR (Phase 8): the guide index regenerates daily.
export const revalidate = 86400;

// Canonical is always /guides — the ?q= search is a filtered view of the same
// hub, so it must not fork the canonical URL (roadmap §9.12 faceted-nav rule).
export const metadata: Metadata = buildMetadata({
  title: 'Clash of Clans upgrade guides & free rush checker | CoachScore',
  description:
    'Evergreen Town Hall upgrade guides (TH11–18): what to upgrade first, hero ' +
    'equipment priority, and a free rush checker. AI-drafted, human-verified.',
  path: '/guides',
});

const PILLAR_ORDER: readonly SeoPillar[] = [
  'rush',
  'upgrade-order',
  'equipment',
];

const PILLAR_META: Record<SeoPillar, { title: string; blurb: string }> = {
  rush: {
    title: 'Rush & de-rush',
    blurb: 'Find out if your account is rushed — and the order to fix it.',
  },
  'upgrade-order': {
    title: 'Upgrade order by Town Hall',
    blurb: 'What to upgrade first at each Town Hall, weighted to your goal.',
  },
  equipment: {
    title: 'Hero equipment (TH16+)',
    blurb: 'Which equipment to level first, balanced against hero levels.',
  },
  'account-rating': {
    title: 'Account rating',
    blurb: 'How the seven-dimension score works.',
  },
};

function GuideLink({ guide }: { guide: SeoGuide }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="block">
      <PremiumCard
        tone="plain"
        className="p-4 transition hover:shadow-glow-violet-sm"
      >
        <span className="font-semibold text-white">{guide.h1}</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">
          {guide.description}
        </span>
      </PremiumCard>
    </Link>
  );
}

function matches(guide: SeoGuide, q: string): boolean {
  const hay =
    `${guide.title} ${guide.h1} ${guide.description} ${guide.intro}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = (raw ?? '').trim();
  const results = q ? SEO_GUIDES.filter((g) => matches(g, q)) : [];

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Guides', href: '/guides' },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        Clash of Clans{' '}
        <span className="text-violet-gradient">upgrade guides</span>
      </h1>
      <p className="mt-2 text-[15px] text-[var(--muted)]">
        Goal-aware upgrade orders, hero-equipment priorities, and a free rush
        checker — then get your account scored in under a minute.
      </p>

      {/* Native GET search — works without JS and is the SearchAction target. */}
      <form action="/guides" method="get" className="mt-6" role="search">
        <label htmlFor="guide-search" className="sr-only">
          Search guides
        </label>
        <input
          id="guide-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search guides — e.g. “th14” or “rushed”"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[var(--muted)]/70 focus:border-brand-violet/50 focus:outline-none"
        />
      </form>

      {q ? (
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
            </h2>
            <Link
              href="/guides"
              className="text-sm text-brand-violet-light hover:text-white"
            >
              Clear
            </Link>
          </div>
          {results.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {results.map((guide) => (
                <li key={guide.slug}>
                  <GuideLink guide={guide} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">
              No guides matched. Try a Town Hall number (e.g. “th15”) or a topic
              like “rushed” or “equipment”.
            </p>
          )}
        </section>
      ) : (
        PILLAR_ORDER.map((pillar) => {
          const guides = guidesByPillar(pillar);
          if (guides.length === 0) return null;
          return (
            <section
              key={pillar}
              className="mt-9"
              aria-labelledby={`pillar-${pillar}`}
            >
              <h2
                id={`pillar-${pillar}`}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
              >
                {PILLAR_META[pillar].title}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {PILLAR_META[pillar].blurb}
              </p>
              <ul className="mt-3 space-y-2.5">
                {guides.map((guide) => (
                  <li key={guide.slug}>
                    <GuideLink guide={guide} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <nav className="mt-10 border-t border-white/10 pt-5 text-sm">
        <Link
          href="/methodology"
          className="text-brand-violet-light hover:text-white"
        >
          How CoachScore grades accounts →
        </Link>
      </nav>
    </div>
  );
}
