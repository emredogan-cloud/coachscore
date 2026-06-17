import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

export default defineConfig({
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'lib/**/*.test.ts'],
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
