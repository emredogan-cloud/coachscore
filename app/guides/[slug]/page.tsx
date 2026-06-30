import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import {
  EyebrowPill,
  MagicButton,
  PremiumCard,
  SectionDivider,
} from '@/components/ui';
import type { Goal } from '@/lib/core';
import { EQUIPMENT_MIN_TOWN_HALL } from '@/lib/core';
import {
  getTownHallReference,
  heroIdsUnlockedAt,
  type HeroId,
} from '@/lib/game-data';
import {
  articleJsonLd,
  buildMetadata,
  canonicalUrl,
  faqJsonLd,
  freshnessLabel,
  gameDataVersion,
  getSeoGuide,
  guideLastModified,
  howToJsonLd,
  relatedGuides,
  SEO_GUIDE_SLUGS,
  type JsonLd,
  type SeoGuide,
} from '@/lib/seo';

export const dynamicParams = false;
// ISR (Phase 8): regenerate guides daily so evergreen content stays fresh
// without a rebuild, while serving cached static HTML for fast SEO TTFB.
export const revalidate = 86400;

export function generateStaticParams(): { slug: string }[] {
  return SEO_GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (guide === null) return { title: 'Not found — CoachScore' };
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: 'article',
  });
}

const HERO_NAMES: Readonly<Record<HeroId, string>> = {
  barbarianKing: 'Barbarian King',
  archerQueen: 'Archer Queen',
  grandWarden: 'Grand Warden',
  royalChampion: 'Royal Champion',
  minionPrince: 'Minion Prince',
  dragonDuke: 'Dragon Duke',
};

/** Eyebrow tag pills, derived from the guide's existing kind / Town-Hall. */
function guideEyebrows(
  guide: SeoGuide,
): { label: string; tone: 'gold' | 'violet' }[] {
  const out: { label: string; tone: 'gold' | 'violet' }[] = [];
  if (guide.townHall !== null)
    out.push({ label: `TH${guide.townHall}`, tone: 'violet' });
  const focus: Record<SeoGuide['kind'], string> = {
    rush_check: 'Rush focus',
    upgrade_order: 'Upgrade order',
    equipment_priority: 'Equipment focus',
  };
  out.push({ label: focus[guide.kind], tone: 'gold' });
  return out;
}

/** Map a guide to the scoring goal whose weights best describe its emphasis. */
function goalFor(kind: SeoGuide['kind']): Goal {
  if (kind === 'rush_check') return 'derush';
  return 'war';
}

/**
 * Real per-Town-Hall hero level caps from the verified reference table. The
 * numbers are exact reference data (no fabrication); a best-effort flag is
 * surfaced when the table marks any cap as unverified.
 */
function heroLevelRows(townHall: number) {
  const ref = getTownHallReference(townHall);
  return heroIdsUnlockedAt(townHall).map((id) => ({
    id,
    name: HERO_NAMES[id],
    maxLevel: ref.heroes[id].maxLevel,
    needsVerification: ref.heroes[id].needsVerification,
  }));
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (guide === null) notFound();

  const url = canonicalUrl(`/guides/${guide.slug}`);
  const updated = guideLastModified(guide);
  const related = relatedGuides(guide);

  const jsonLd: JsonLd[] = [
    articleJsonLd({
      headline: guide.h1,
      description: guide.description,
      url,
      dateModified: updated,
    }),
    faqJsonLd(guide.faqs),
  ];
  // HowTo only where the page genuinely describes an ordered procedure.
  if (guide.kind === 'rush_check') {
    jsonLd.push(
      howToJsonLd({
        name: 'How to de-rush a Clash of Clans account',
        description:
          'Catch up the cheapest high-impact gaps first to raise your grade.',
        steps: [
          {
            name: 'Catch up heroes',
            text: 'Level under-developed heroes for your current Town Hall first — the cheapest early levels close the biggest grade gap.',
          },
          {
            name: 'Catch up key defenses',
            text: 'Bring under-levelled key defenses up to the maxed baseline for your Town Hall.',
          },
          {
            name: 'Finish offense, then walls',
            text: 'Complete your main attack upgrades, then schedule walls last once everything else is in range.',
          },
        ],
      }),
    );
  }

  // Presentation-only: hero caps + dimension weights are read live (not faked).
  const heroRows = guide.townHall !== null ? heroLevelRows(guide.townHall) : [];
  const anyUnverified = heroRows.some((r) => r.needsVerification);
  const tier =
    guide.townHall !== null && guide.townHall >= EQUIPMENT_MIN_TOWN_HALL
      ? 'th16plus'
      : 'below16';

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <JsonLdScript data={jsonLd} />
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Guides', href: '/guides' },
          { name: guide.h1, href: `/guides/${guide.slug}` },
        ]}
      />

      <header className="mt-4">
        <div className="flex flex-wrap gap-2">
          {guideEyebrows(guide).map((e) => (
            <EyebrowPill key={e.label} tone={e.tone}>
              {e.label}
            </EyebrowPill>
          ))}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          {guide.h1}
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Updated {freshnessLabel(updated)} · data {gameDataVersion()}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          {guide.intro}
        </p>
      </header>

      {guide.dataPoints.length > 0 ? (
        <PremiumCard tone="violet" glowed className="mt-8 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
            {guide.townHall !== null
              ? `TH${guide.townHall} reference (max levels)`
              : 'At a glance'}
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm">
            {guide.dataPoints.map((dp) => (
              <div
                key={dp.label}
                className="flex items-baseline justify-between gap-2 border-b border-white/8 pb-2"
              >
                <dt className="text-[var(--muted)]">{dp.label}</dt>
                <dd className="text-right font-semibold text-white">
                  {dp.value}
                </dd>
              </div>
            ))}
          </dl>
        </PremiumCard>
      ) : null}

      {/* How the grade is weighted — real CoachScore weights, not fabricated. */}
      <section className="mt-12" aria-labelledby="weights-heading">
        <SectionDivider className="mb-5">
          <span id="weights-heading">How the grade is weighted</span>
        </SectionDivider>
        <PremiumCard tone="plain" className="p-6">
          <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
            CoachScore grades seven dimensions and orders your roadmap by
            cost-weighted impact. These are the live weights for this
            guide&rsquo;s emphasis — the bars show how much each dimension moves
            your grade.
          </p>
          <ScoreBreakdown goal={goalFor(guide.kind)} tier={tier} />
        </PremiumCard>
      </section>

      {/* Hero level caps — exact reference numbers for this Town Hall. */}
      {heroRows.length > 0 ? (
        <section className="mt-12" aria-labelledby="hero-levels-heading">
          <SectionDivider className="mb-5">
            <span id="hero-levels-heading">Hero level caps</span>
          </SectionDivider>
          <PremiumCard tone="plain" className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  <th className="px-5 py-3 font-semibold text-white/90">
                    Hero
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-white/90">
                    Max level at TH{guide.townHall}
                  </th>
                </tr>
              </thead>
              <tbody>
                {heroRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/8 last:border-0"
                  >
                    <td className="px-5 py-3 text-[var(--muted)]">{r.name}</td>
                    <td className="px-5 py-3 text-right font-bold text-brand-gold tabular-nums">
                      {r.maxLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PremiumCard>
          {anyUnverified ? (
            <p className="mt-2 text-xs text-[var(--muted)]/80">
              Best-effort values from the CoachScore reference table — confirm
              against the live game for edge cases.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Body sections */}
      <div className="mt-12 space-y-8">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-white">{section.heading}</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--muted)]">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <PremiumCard tone="gold" glowed className="mt-12 p-6 text-center">
        <p className="text-lg font-semibold text-white">{guide.ctaText}</p>
        <div className="mt-4 flex justify-center">
          <MagicButton href="/report" variant="gold">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>

      {guide.faqs.length > 0 ? (
        <section className="mt-12" aria-labelledby="faq-heading">
          <SectionDivider className="mb-5">
            <span id="faq-heading">FAQ</span>
          </SectionDivider>
          <div className="space-y-3">
            {guide.faqs.map((faq) => (
              <PremiumCard key={faq.question} tone="plain" className="p-5">
                <h3 className="font-semibold text-white">{faq.question}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                  {faq.answer}
                </p>
              </PremiumCard>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-12" aria-labelledby="related-heading">
          <SectionDivider className="mb-5">
            <span id="related-heading">Related guides</span>
          </SectionDivider>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {related.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block h-full">
                  <PremiumCard
                    tone="plain"
                    className="flex h-full items-center justify-between gap-2 p-4 transition hover:shadow-glow-violet-sm"
                  >
                    <span className="text-sm font-medium text-white/90">
                      {link.label}
                    </span>
                    <span aria-hidden className="text-brand-violet-light">
                      →
                    </span>
                  </PremiumCard>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="mt-10 border-t border-white/8 pt-5 text-sm">
        <Link
          href="/methodology"
          className="text-brand-violet-light transition hover:text-white"
        >
          How CoachScore grades accounts →
        </Link>
      </nav>
    </article>
  );
}
