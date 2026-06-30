import type { Metadata } from 'next';
import {
  Breadcrumbs,
  BrandMark,
  DimensionBar,
  EyebrowPill,
  GradeBadge,
  MagicButton,
  PremiumCard,
  ScoreRing,
  SectionDivider,
  TrustBar,
} from '@/components/ui';

/**
 * Internal design-system styleguide (Phase 2) — renders every premium primitive
 * for visual QA + reference. Noindexed; not part of the public IA.
 */
export const metadata: Metadata = {
  title: 'Styleguide · CoachScore',
  robots: { index: false, follow: false },
};

const shieldIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5l8-3z" />
  </svg>
);

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <header className="space-y-3">
        <EyebrowPill>Design System · Phase 2</EyebrowPill>
        <h1 className="text-4xl font-extrabold text-white">
          CoachScore <span className="text-violet-gradient">styleguide</span>
        </h1>
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Styleguide' }]}
        />
      </header>

      <SectionDivider>Brand</SectionDivider>
      <div className="flex flex-wrap items-center gap-8">
        <BrandMark href={null} />
        <BrandMark href={null} showWordmark={false} size={48} />
      </div>

      <SectionDivider>Buttons</SectionDivider>
      <div className="flex flex-wrap items-center gap-4">
        <MagicButton variant="gold">Analyze my account</MagicButton>
        <MagicButton variant="violet">Get my CoachScore</MagicButton>
        <MagicButton variant="ghost">See pricing</MagicButton>
      </div>

      <SectionDivider>Pills &amp; grades</SectionDivider>
      <div className="flex flex-wrap items-center gap-3">
        <EyebrowPill tone="gold">Free · Objective · Instant</EyebrowPill>
        <EyebrowPill tone="violet">Most popular</EyebrowPill>
        {['S', 'A', 'B', 'C', 'D', 'E'].map((g) => (
          <GradeBadge key={g} grade={g} />
        ))}
      </div>

      <SectionDivider>Score ring &amp; dimensions</SectionDivider>
      <div className="flex flex-wrap items-center gap-10">
        <ScoreRing value={74} grade="B" />
        <div className="w-full max-w-sm space-y-3">
          <DimensionBar label="Heroes" percent={81} icon={shieldIcon} />
          <DimensionBar label="Offense" percent={77} icon={shieldIcon} />
          <DimensionBar
            label="Progression (rush)"
            percent={62}
            icon={shieldIcon}
          />
        </div>
      </div>

      <SectionDivider>Cards</SectionDivider>
      <div className="grid gap-4 sm:grid-cols-2">
        <PremiumCard className="p-5">
          <h3 className="font-bold text-white">Premium card</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Dark translucent surface, gradient hairline border, soft glow.
          </p>
        </PremiumCard>
        <PremiumCard tone="gold" glowed className="p-5">
          <h3 className="font-bold text-white">Featured card</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Gold border + glow.
          </p>
        </PremiumCard>
      </div>

      <SectionDivider>Trust bar</SectionDivider>
      <TrustBar
        items={[
          {
            icon: shieldIcon,
            title: '100% Transparent',
            subtitle: 'Deterministic engine',
          },
          {
            icon: shieldIcon,
            title: 'Official API',
            subtitle: 'Secure & verified',
          },
          {
            icon: shieldIcon,
            title: 'Privacy first',
            subtitle: 'No login stored',
          },
          {
            icon: shieldIcon,
            title: 'Built by players',
            subtitle: 'For players',
          },
        ]}
      />
    </div>
  );
}
