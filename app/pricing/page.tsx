import type { Metadata } from 'next';
import { activationStatus } from '@/lib/activation';
import { PricingTable } from '@/components/pricing/pricing-table';
import { ProductCards } from '@/components/products/product-cards';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { HeroBanner } from '@/components/ui';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Pricing — one-time Clash of Clans account reports | CoachScore',
  description:
    'One-time CoachScore reports: a free teaser, instant AI reports, and ' +
    'human-verified coaching tiers. No subscription.',
  path: '/pricing',
});

export default function PricingPage() {
  const { payments } = activationStatus();
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Pricing', href: '/pricing' },
        ]}
      />
      <div className="mt-3">
        <HeroBanner
          crest
          headline="Pricing — one-time Clash of Clans reports"
          tagline="Expert ratings · strategic advantage"
        />
      </div>
      <p className="mt-5 text-center text-[15px] text-[var(--muted)]">
        One-time reports — no subscription. AI-drafted, human-verified coaching.
      </p>
      {!payments ? (
        <p className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-center text-sm text-amber-200/90">
          Checkout is not activated yet (Stripe not configured). Browse the
          plans below — purchasing turns on once payments are live.
        </p>
      ) : null}
      <div className="mt-8">
        <PricingTable />
      </div>

      <section className="mt-14" aria-labelledby="addons-heading">
        <h2
          id="addons-heading"
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Specialized coaching tools
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[var(--muted)]">
          Targeted, one-off analysis — submit an attack replay, a base layout,
          or your next war and get an instant report a coach can verify.
        </p>
        <div className="mt-6">
          <ProductCards />
        </div>
      </section>
    </div>
  );
}
