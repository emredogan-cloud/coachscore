import type { Metadata } from 'next';
import { TrackOnMount } from '@/components/analytics/track';
import { ReportFlow } from '@/components/report/report-flow';
import { WarRoomIntro } from '@/components/report/war-room-intro';
import { EyebrowPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Analyze your Clash of Clans account — CoachScore',
  description:
    'Paste your player tag for an instant, objective CoachScore — your grade ' +
    'and biggest weakness, free — then unlock the full prioritized upgrade ' +
    'roadmap.',
};

/**
 * The magic moment: paste tag → instant objective score → share / unlock.
 * Scoring works with no account; the tag path uses the official API when
 * activated and falls back to manual entry otherwise.
 */
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string }>;
}) {
  const { invited } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <WarRoomIntro />
      {invited ? (
        <>
          <TrackOnMount event="referral_visit" />
          <p className="mb-4 rounded-xl border border-brand-gold/25 bg-brand-gold/10 p-3 text-center text-sm text-brand-gold-light">
            A friend invited you to CoachScore — here&apos;s your free analysis.
          </p>
        </>
      ) : null}
      <div className="flex justify-center">
        <EyebrowPill tone="violet">Free · Objective · Instant</EyebrowPill>
      </div>
      <h1 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-violet-gradient">
        Analyze your account
      </h1>
      <p className="mt-3 text-center text-[15px] text-[var(--muted)]">
        Paste your player tag for an instant, objective score and your biggest
        weakness — free. Then unlock your full upgrade roadmap.
      </p>
      <div className="mt-8">
        <ReportFlow />
      </div>
    </div>
  );
}
