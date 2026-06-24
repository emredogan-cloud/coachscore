import type { Metadata } from 'next';
import { ReferralPanel } from '@/components/growth/referral-panel';
import { buildMetadata } from '@/lib/seo';
import { HeroBanner } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Refer friends, earn credit — CoachScore',
  description:
    'Share your CoachScore referral code: your friends get a discount and you ' +
    'earn credit when they buy. Rate your Clash of Clans account free.',
  path: '/referrals',
});

export default function ReferralsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <HeroBanner tagline="Refer friends · earn credit" />
      <p className="mt-5 text-center text-[15px] text-[var(--muted)]">
        Share your code. Friends get a discount on their first report, and you
        earn credit when they buy — the creator-code model you already know.
      </p>
      <div className="mt-8">
        <ReferralPanel />
      </div>
    </div>
  );
}
