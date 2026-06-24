import type { MetadataRoute } from 'next';

/**
 * PWA manifest (Phase 9). Makes CoachScore installable as a standalone app —
 * the web-first/PWA strategy of ADR-0006. Next auto-injects the manifest link.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CoachScore — Clash of Clans account rating',
    short_name: 'CoachScore',
    description:
      'Rate your Clash of Clans account and get a prioritized, goal-aware ' +
      'upgrade roadmap. AI-drafted, human-verified.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
