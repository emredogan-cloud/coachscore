import type { Metadata, Viewport } from 'next';
import { Copilot } from '@/components/copilot/copilot';
import { Disclaimer } from '@/components/disclaimer';
import { ConsentBanner } from '@/components/growth/consent-banner';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import { JsonLdScript } from '@/components/seo/json-ld';
import {
  organizationJsonLd,
  orgLogoUrl,
  siteUrl,
  socialProfiles,
  websiteJsonLd,
} from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  // Absolute base for canonical/OG/Twitter URL resolution (fixes the localhost
  // canonical bug — roadmap §9.1) and silences Next's metadataBase warning.
  metadataBase: new URL(siteUrl()),
  title: 'CoachScore — Rate My Account & Upgrade Roadmap for Clash of Clans',
  description:
    'Get your Clash of Clans account scored and receive a prioritized, ' +
    'goal-aware upgrade roadmap. AI-drafted, built from your real in-game data.',
  applicationName: 'CoachScore',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070510',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Site-wide structured data: Organization (with logo + any real sameAs
  // profiles) and WebSite (with a sitelinks SearchAction) — rendered once here
  // so every page carries them (roadmap §9.2, §11).
  const siteJsonLd = [
    organizationJsonLd(siteUrl(), {
      logoUrl: orgLogoUrl(),
      sameAs: socialProfiles(),
    }),
    websiteJsonLd(siteUrl()),
  ];

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <JsonLdScript data={siteJsonLd} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10">
          <Disclaimer />
        </footer>
        <ConsentBanner />
        <Copilot />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
