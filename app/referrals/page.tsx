import type { Metadata } from 'next';
import { ReferralPanel } from '@/components/growth/referral-panel';
import { buildMetadata } from '@/lib/seo';

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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Refer friends</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Share your code. Your friends get a discount on their first report, and
        you earn credit when they buy — the creator-code model you already know.
      </p>
      <div className="mt-8">
        <ReferralPanel />
      </div>
    </div>
  );
}
