// @ts-check

/**
 * CoachScore Next.js configuration.
 *
 * Web-first PWA, mobile-first. Strict by design — production builds fail on
 * type or lint errors (no `ignoreBuildErrors` escape hatches). See
 * docs/adr/0006-web-first-pwa-stripe-no-app-store.md.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // ESLint is enforced as a dedicated, STRICTER CI gate: `pnpm lint`
    // (`eslint . --max-warnings=0`) with the Next plugin + typescript-eslint.
    // We skip the duplicate in-build pass only because Next's flat-config
    // detector spuriously warns; this is NOT an error escape hatch.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors MUST fail the production build. Never relax this.
    ignoreBuildErrors: false,
  },
  // Security headers applied to every route. Expanded in the production-readiness
  // phase; this baseline is intentionally conservative.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
