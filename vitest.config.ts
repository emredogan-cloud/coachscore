import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

export default defineConfig({
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
  // Use the automatic JSX runtime so component render tests (.tsx) transform
  // without a React import; matches React 19 / Next's automatic runtime.
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'lib/**/*.test.ts'],
    // Live, API-hitting integration tests run via `pnpm test:integration`.
    exclude: [...configDefaults.exclude, 'tests/integration/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/index.ts',
        'lib/**/types.ts',
        'lib/env.ts',
        // Real third-party I/O boundary — exercised by the live integration
        // test (pnpm test:integration), not by unit tests.
        'lib/ai/provider.ts',
        'lib/queue/jobs.ts',
        // Phase 8 durable-queue persistence + resolution boundaries — exercised
        // against Postgres at activation; the durable runner + memory async
        // store cover the logic in unit tests.
        'lib/queue/drizzle-store.ts',
        'lib/queue/wire.ts',
        // Phase 9 observability wiring — resolves console/Sentry/BetterStack
        // adapters at activation; the logger/monitoring/health logic is tested.
        'lib/observability/wire.ts',
        // Phase 3 database I/O boundary — declarative schema + the live
        // Postgres client/repositories, exercised once Supabase is provisioned.
        // The in-memory repositories cover the persistence logic in unit tests.
        'lib/db/schema.ts',
        'lib/db/client.ts',
        'lib/db/repositories/drizzle.ts',
        // Persistence wiring that resolves the live DB repositories; the handler
        // tests inject a fake `persist`, so the logic is covered without a DB.
        'lib/api/persist.ts',
        // Phase 4 third-party HTTP boundaries — Stripe + Resend over fetch,
        // exercised at activation. Signature/state/template logic is tested
        // purely; handlers/pipelines inject fakes.
        'lib/payments/stripe-adapter.ts',
        'lib/email/resend-adapter.ts',
        'lib/api/payment-wire.ts',
        'lib/payouts/connect-adapter.ts',
        'lib/api/marketplace-wire.ts',
        // Phase 6 product persistence wiring — resolves the live DB repositories;
        // the handler tests inject fake `persist`/`fetch`, so the logic is covered
        // without a database.
        'lib/api/product-wire.ts',
        // Phase 7 third-party + DB wiring boundaries — resolved at activation;
        // the handlers/services inject fakes in tests.
        'lib/analytics/posthog-adapter.ts',
        'lib/api/growth-wire.ts',
      ],
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
