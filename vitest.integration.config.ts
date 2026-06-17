import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

/**
 * Live integration tests — hit real third-party APIs (Anthropic). Run locally
 * with credentials via `pnpm test:integration`. Excluded from the default suite
 * and from public CI (no paid key in a public repo). Self-skips without a key.
 */
export default defineConfig({
  resolve: {
    alias: { '@': rootDir },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
