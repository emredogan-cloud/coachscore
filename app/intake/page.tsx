import type { Metadata } from 'next';
import { activationStatus } from '@/lib/activation';
import { IntakeWizard } from '@/components/intake/intake-wizard';
import { Breadcrumbs, BrandMark, EyebrowPill } from '@/components/ui';

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
 * paths light up as their credentials are provisioned. Premium dark-native
 * presentation (presentation-only — the wizard owns all state + submit logic).
 */
export default function IntakePage() {
  const activation = activationStatus();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Analyze' }]}
      />

      <header className="mt-8 flex flex-col items-center text-center">
        <BrandMark href={null} showWordmark={false} size={52} />
        <div className="mt-5">
          <EyebrowPill tone="gold">Free · Objective · Instant</EyebrowPill>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Analyze your <span className="text-violet-gradient">account</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)]">
          Choose how to submit your Clash of Clans account. Manual entry works
          right now; the tag and screenshot paths activate once their services
          are connected.
        </p>
      </header>

      <IntakeWizard activation={activation} />
    </div>
  );
}
