import type { Metadata } from 'next';
import { ReportFlow } from '@/components/report/report-flow';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your CoachScore report',
  description:
    'Get your free CoachScore teaser, then unlock the full report: diagnosis, ' +
    'strengths, weaknesses, and a prioritized upgrade roadmap with a PDF export.',
};

/**
 * Report experience (Phase 4): the teaser → full-report funnel. Scoring works
 * with no credentials; purchasing the full report activates with Stripe.
 */
export default function ReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Your CoachScore</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Enter your account to see your free score and top weakness, then unlock
        the full report.
      </p>
      <div className="mt-8">
        <ReportFlow />
      </div>
    </div>
  );
}
