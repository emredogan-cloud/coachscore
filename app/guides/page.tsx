import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import {
  EyebrowPill,
  MagicButton,
  PremiumCard,
  SectionDivider,
} from '@/components/ui';
import {
  buildMetadata,
  freshnessLabel,
  guideLastModified,
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
    'equipment priority, and a free rush checker. AI-drafted from versioned reference data.',
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

// --- Presentation-only derivations (no reference data fabricated) ----------

/**
 * Estimated read time, derived from the guide's own prose at ~210 wpm. Purely
 * presentational — it reads no game data and invents none.
 */
function readMinutes(guide: SeoGuide): number {
  const words = `${guide.intro} ${guide.sections
    .map((s) => `${s.heading} ${s.body}`)
    .join(' ')} ${guide.faqs.map((f) => `${f.question} ${f.answer}`).join(' ')}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(2, Math.round(words / 210));
}

/** Short tag pills for a card, derived from existing kind / Town-Hall fields. */
function guideTags(guide: SeoGuide): string[] {
  const tags: string[] = [];
  if (guide.townHall !== null) tags.push(`TH${guide.townHall}`);
  const byKind: Record<SeoGuide['kind'], string> = {
    rush_check: 'Rush check',
    upgrade_order: 'Upgrade order',
    equipment_priority: 'Equipment',
  };
  tags.push(byKind[guide.kind]);
  return tags;
}

/**
 * Abstract, IP-safe card emblem — a pure-CSS gradient glyph (NO Clash building
 * or troop art). The glyph differs by guide kind so cards read distinctly.
 */
function CardEmblem({ kind }: { kind: SeoGuide['kind'] }) {
  const glyph =
    kind === 'rush_check' ? '◆' : kind === 'equipment_priority' ? '✦' : '▲';
  return (
    <span
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-violet-gradient text-lg text-white shadow-glow-violet-sm"
    >
      {glyph}
    </span>
  );
}

/** Featured card — larger, with emblem, tag pills, title and meta line. */
function FeaturedCard({ guide }: { guide: SeoGuide }) {
  const updated = freshnessLabel(guideLastModified(guide));
  return (
    <Link href={`/guides/${guide.slug}`} className="block">
      <PremiumCard
        tone="violet"
        className="p-5 transition hover:shadow-glow-violet-sm"
      >
        <div className="flex items-start gap-3">
          <CardEmblem kind={guide.kind} />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {guideTags(guide).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-violet-light"
                >
                  {t}
                </span>
              ))}
            </div>
            <span className="mt-2 block font-semibold leading-snug text-white">
              {guide.h1}
            </span>
            <span className="mt-1.5 block text-xs font-medium text-[var(--muted)]">
              {readMinutes(guide)} min read · Updated {updated}
            </span>
          </div>
        </div>
      </PremiumCard>
    </Link>
  );
}

/** Compact list card used in the "All guides" grid and search results. */
function GuideCard({ guide }: { guide: SeoGuide }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="block h-full">
      <PremiumCard
        tone="plain"
        className="flex h-full flex-col p-5 transition hover:shadow-glow-violet-sm"
      >
        <div className="flex items-start gap-3">
          <CardEmblem kind={guide.kind} />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {guideTags(guide).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <span className="mt-2 block font-semibold leading-snug text-white">
              {guide.h1}
            </span>
          </div>
        </div>
        <span className="mt-2.5 block text-sm leading-relaxed text-[var(--muted)]">
          {guide.description}
        </span>
        <span className="mt-3 block text-xs font-medium text-brand-gold/80">
          {readMinutes(guide)} min read
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

// Filter chips. Each chip is a plain link that sets ?q= — so it reuses the
// existing native-GET search (works without JS, no canonical fork). "All"
// clears the query. Town-Hall and category chips just pre-fill a query term.
const TOWN_HALLS = [18, 17, 16, 15, 14, 13, 12, 11] as const;
const CATEGORY_CHIPS: readonly { label: string; q: string }[] = [
  { label: 'Rushed', q: 'rushed' },
  { label: 'Upgrade order', q: 'upgrade order' },
  { label: 'Equipment', q: 'equipment' },
];

function chipClass(selected: boolean): string {
  return selected
    ? 'rounded-full bg-violet-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-glow-violet-sm'
    : 'rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-brand-violet/40 hover:text-white';
}

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = (raw ?? '').trim();
  const ql = q.toLowerCase();
  const results = q ? SEO_GUIDES.filter((g) => matches(g, q)) : [];

  // Featured = the lead guide of each pillar (rush, upgrade-order, equipment).
  const featured = PILLAR_ORDER.map((p) => guidesByPillar(p)[0]).filter(
    (g): g is SeoGuide => g !== undefined,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Guides', href: '/guides' },
        ]}
      />

      <header className="mt-4">
        <EyebrowPill>TH11 · TH18 · Rush checker</EyebrowPill>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Upgrade Smarter,{' '}
          <span className="text-violet-gradient">Dominate Faster</span>
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
          Goal-aware upgrade orders, hero-equipment priorities, and a free rush
          checker — then get your account scored in under a minute.
        </p>
      </header>

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
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)]/70 focus:border-brand-violet/50 focus:outline-none"
        />
      </form>

      {/* Filter chips — links that drive the existing ?q= search. */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/guides" className={chipClass(q === '')}>
          All
        </Link>
        {TOWN_HALLS.map((th) => {
          const term = `th${th}`;
          return (
            <Link
              key={th}
              href={`/guides?q=${term}`}
              className={chipClass(ql === term)}
            >
              TH{th}
            </Link>
          );
        })}
        {CATEGORY_CHIPS.map((c) => (
          <Link
            key={c.q}
            href={`/guides?q=${encodeURIComponent(c.q)}`}
            className={chipClass(ql === c.q.toLowerCase())}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {q ? (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
            </h2>
            <Link
              href="/guides"
              className="text-sm text-brand-violet-light transition hover:text-white"
            >
              Clear
            </Link>
          </div>
          {results.length > 0 ? (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((guide) => (
                <li key={guide.slug}>
                  <GuideCard guide={guide} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">
              No guides matched. Try a Town Hall number (e.g. “th15”) or a topic
              like “rushed” or “equipment”.
            </p>
          )}
        </section>
      ) : (
        <>
          {featured.length > 0 ? (
            <section className="mt-10" aria-labelledby="featured-heading">
              <SectionDivider className="mb-5">
                <span id="featured-heading">Featured</span>
              </SectionDivider>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {featured.map((guide) => (
                  <li key={guide.slug}>
                    <FeaturedCard guide={guide} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-12" aria-labelledby="all-guides-heading">
            <SectionDivider className="mb-5">
              <span id="all-guides-heading">All guides</span>
            </SectionDivider>
            {PILLAR_ORDER.map((pillar) => {
              const guides = guidesByPillar(pillar);
              if (guides.length === 0) return null;
              return (
                <div
                  key={pillar}
                  className="mt-8 first:mt-0"
                  aria-labelledby={`pillar-${pillar}`}
                >
                  <h3
                    id={`pillar-${pillar}`}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
                  >
                    {PILLAR_META[pillar].title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {PILLAR_META[pillar].blurb}
                  </p>
                  <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {guides.map((guide) => (
                      <li key={guide.slug}>
                        <GuideCard guide={guide} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </>
      )}

      {/* CTA banner */}
      <PremiumCard tone="gold" glowed className="mt-12 p-6 text-center">
        <p className="text-lg font-semibold text-white">
          Ready to see where you stand?
        </p>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Get your free CoachScore in under a minute — no account required.
        </p>
        <div className="mt-4 flex justify-center">
          <MagicButton href="/report" variant="gold">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>

      <nav className="mt-10 border-t border-white/8 pt-5 text-sm">
        <Link
          href="/methodology"
          className="text-brand-violet-light transition hover:text-white"
        >
          How CoachScore grades accounts →
        </Link>
      </nav>
    </div>
  );
}
