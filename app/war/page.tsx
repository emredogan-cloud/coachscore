import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { EyebrowPill, HeroBanner } from '@/components/ui';
import { WarPlanner } from '@/components/war/war-planner';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'War readiness & army recommendations — Clash of Clans | CoachScore',
  description:
    'Are you war-ready? Get an objective war-readiness score, meta-army ' +
    'recommendations for your heroes and lab, missing requirements, and the ' +
    'upgrades that matter most for attacking.',
  path: '/war',
});

export default function WarPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'War readiness', href: '/war' },
        ]}
      />
      <div className="mt-3">
        <HeroBanner
          crest
          headline="Are you war-ready?"
          tagline="Army recommendations + attack upgrade priorities"
        >
          <div className="relative mt-4 flex justify-center">
            <EyebrowPill tone="violet">
              Meta armies · Attack priorities · War ETA
            </EyebrowPill>
          </div>
        </HeroBanner>
      </div>
      <p className="mt-5 text-center text-[15px] text-[var(--muted)]">
        Players don&apos;t pay for scores — they pay to know{' '}
        <span className="text-white">what army to run and what to upgrade</span>
        . Get a war-readiness verdict tuned to your heroes, lab, and goal.
      </p>
      <div className="mt-8">
        <WarPlanner />
      </div>
    </div>
  );
}
