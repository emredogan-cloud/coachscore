import type { Metadata } from 'next';
import { activationStatus } from '@/lib/activation';
import { IntakeWizard } from '@/components/intake/intake-wizard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Score your account — CoachScore',
  description:
    'Submit your Clash of Clans account by tag, screenshot, or manual entry ' +
    'and get a scored CoachScore with a prioritized upgrade roadmap.',
};

/**
 * Intake page (Phase 3). Reads activation status at request time and renders the
 * three-path intake wizard. Scoring works today; persisting and the tag/OCR
 * paths light up as their credentials are provisioned.
 */
export default function IntakePage() {
  const activation = activationStatus();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Score your account</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Choose how to submit your Clash of Clans account. Manual entry works
        right now; the tag and screenshot paths activate once their services are
        connected.
      </p>
      <IntakeWizard activation={activation} />
    </div>
  );
}
