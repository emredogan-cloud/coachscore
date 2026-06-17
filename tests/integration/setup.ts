/**
 * Integration-test setup: load `.env` (git-ignored) so live tests can read
 * ANTHROPIC_API_KEY locally. No-op when the file is absent (e.g. in CI), where
 * the live tests self-skip.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // .env not present — live tests will self-skip on the missing key.
}
