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
      'upgrade roadmap. AI-drafted, built from your real in-game data.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#070510',
    theme_color: '#070510',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      // PNG maskable icons (Phase 1) — Android adaptive icons need raster +
      // a safe zone; the shield sits within the inner 66% of a dark canvas.
      {
        src: '/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
