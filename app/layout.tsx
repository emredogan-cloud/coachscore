import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import { Copilot } from '@/components/copilot/copilot';
import { ConsentBanner } from '@/components/growth/consent-banner';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import { JsonLdScript } from '@/components/seo/json-ld';
import { SiteFooter, SiteNav } from '@/components/ui';
import {
  organizationJsonLd,
  orgLogoUrl,
  siteUrl,
  socialProfiles,
  websiteJsonLd,
} from '@/lib/seo';
import './globals.css';

// Premium display + body face (Phase 2). Outfit — a confident geometric sans
// that matches the bold headline feel of /interface/new. Exposed as
// --font-display (consumed by tailwind `font-display` + the body in globals.css).
const display = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

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
  // Premium shield brand mark (Phase 1) — SVG favicon (sharp at any size) +
  // PNG apple-touch-icon (iOS doesn't render SVG touch icons).
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
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
    <html lang="en" className={display.variable}>
      <body className="flex min-h-screen flex-col">
        <JsonLdScript data={siteJsonLd} />
        <SiteNav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/8">
          <SiteFooter />
        </footer>
        <ConsentBanner />
        <Copilot />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
