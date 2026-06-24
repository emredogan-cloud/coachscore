import type { Metadata, Viewport } from 'next';
import { Disclaimer } from '@/components/disclaimer';
import { ConsentBanner } from '@/components/growth/consent-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoachScore — Rate My Account & Upgrade Roadmap for Clash of Clans',
  description:
    'Get your Clash of Clans account scored and receive a prioritized, ' +
    'goal-aware upgrade roadmap. AI-drafted, human-verified expert coaching.',
  applicationName: 'CoachScore',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800">
          <Disclaimer />
        </footer>
        <ConsentBanner />
      </body>
    </html>
  );
}
