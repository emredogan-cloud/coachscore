/**
 * Typed, lazy environment access.
 *
 * Phase-0 variables have safe defaults so the app builds and runs without any
 * secrets. Secret-backed variables (Anthropic, Supabase, Stripe, ...) are read
 * lazily by the phase that needs them, and that phase is responsible for
 * failing loudly if its credential is missing — so a missing key gates exactly
 * one feature instead of breaking the whole build.
 */

/** Read a required server env var, throwing a clear error if absent. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `See .env.example for the variable and the phase that introduces it.`,
    );
  }
  return value;
}

/** Read an optional env var with a fallback. */
export function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

/** Phase-0 public app configuration (always available). */
export const appConfig = {
  url: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  env: optionalEnv('NEXT_PUBLIC_APP_ENV', 'development'),
} as const;

/** The mandatory fan-content disclaimer, surfaced on every page and artifact. */
export const SUPERCELL_DISCLAIMER =
  'This material is unofficial and is not endorsed by Supercell. ' +
  'Clash of Clans is a trademark of Supercell.';
