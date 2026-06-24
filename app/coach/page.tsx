import type { Metadata } from 'next';
import Link from 'next/link';
import { activationStatus } from '@/lib/activation';
import { CoachApplyForm } from '@/components/coach/coach-apply-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Become a coach — CoachScore',
  description:
    'Apply to review AI-drafted CoachScore reports, sign off on quality, and ' +
    'earn 60% of each human-reviewed report.',
};

export default function CoachPage() {
  const { database } = activationStatus();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Become a CoachScore coach
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Review AI-drafted reports, sign off on quality, and earn 60% of each
        human-reviewed report.
      </p>
      {!database ? (
        <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30">
          Applications are implemented but not activated yet (needs the database
          + Supabase Auth). You can fill the form; submission reports
          not_activated until it is connected.
        </p>
      ) : null}
      <div className="mt-8">
        <CoachApplyForm />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/coach/dashboard" className="underline">
          Go to your coach dashboard →
        </Link>
      </p>
    </div>
  );
}
