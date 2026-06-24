/**
 * Activation gates (Phase 3).
 *
 * Phase 3 is implemented in code but its external dependencies (Postgres via
 * Supabase, Cloudflare R2, the CoC API proxy) are not provisioned. These pure
 * predicates let routes, server actions, and UI degrade cleanly to a
 * "not activated" state when a credential is absent, and light up automatically
 * the moment it is provided — no code change required.
 */

function present(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '';
}

/** Postgres persistence (Supabase) — accounts, snapshots, reports, jobs, audit. */
export function isDatabaseConfigured(): boolean {
  return present('DATABASE_URL');
}

/** Object storage (Cloudflare R2) — screenshot/PDF/share-card uploads. */
export function isStorageConfigured(): boolean {
  return (
    present('R2_ACCOUNT_ID') &&
    present('R2_ACCESS_KEY_ID') &&
    present('R2_SECRET_ACCESS_KEY') &&
    present('R2_BUCKET')
  );
}

/** Clash of Clans API via the fixed-IP compliant proxy (tag intake path). */
export function isCocApiConfigured(): boolean {
  return present('COC_API_TOKEN') && present('COC_API_PROXY_URL');
}

/** Anthropic (screenshot OCR / report drafting). */
export function isAiConfigured(): boolean {
  return present('ANTHROPIC_API_KEY');
}

/** Stripe payments (Phase 4 checkout + webhooks). */
export function isPaymentsConfigured(): boolean {
  return present('STRIPE_SECRET_KEY');
}

/** Resend transactional email (Phase 4 delivery). */
export function isEmailConfigured(): boolean {
  return present('RESEND_API_KEY');
}

/** PostHog product analytics + experiments (Phase 7). */
export function isAnalyticsConfigured(): boolean {
  return present('NEXT_PUBLIC_POSTHOG_KEY');
}

/** Plausible privacy-friendly traffic analytics (Phase 7). */
export function isPlausibleConfigured(): boolean {
  return present('NEXT_PUBLIC_PLAUSIBLE_DOMAIN');
}

export interface ActivationStatus {
  readonly database: boolean;
  readonly storage: boolean;
  readonly cocApi: boolean;
  readonly ai: boolean;
  readonly payments: boolean;
  readonly email: boolean;
  readonly analytics: boolean;
  readonly plausible: boolean;
}

/** A snapshot of which credential-gated dependencies are currently activated. */
export function activationStatus(): ActivationStatus {
  return {
    database: isDatabaseConfigured(),
    storage: isStorageConfigured(),
    cocApi: isCocApiConfigured(),
    ai: isAiConfigured(),
    payments: isPaymentsConfigured(),
    email: isEmailConfigured(),
    analytics: isAnalyticsConfigured(),
    plausible: isPlausibleConfigured(),
  };
}
