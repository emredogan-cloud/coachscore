/**
 * Analytics abstraction (Phase 7). Provider-agnostic event capture: the service
 * validates against the taxonomy, strips PII (GDPR/KVKK), and dispatches to one
 * or more sinks (PostHog forward + optional local persistence). Every provider
 * is behind this interface, so the logic is unit-tested with an in-memory sink
 * and no network / no key.
 */

export type AnalyticsValue = string | number | boolean | null;
export type AnalyticsProperties = Readonly<Record<string, AnalyticsValue>>;

export type AnalyticsSource = 'web' | 'server';

/** Who/where an event came from. `userId` null ⇒ anonymous (top-of-funnel). */
export interface AnalyticsContext {
  readonly userId?: string | null;
  readonly anonId?: string | null;
  readonly source?: AnalyticsSource;
}

/** A raw event as emitted by the app, before validation/PII-stripping. */
export interface AnalyticsEvent {
  readonly name: string;
  readonly properties?: AnalyticsProperties;
  readonly context?: AnalyticsContext;
}

/** A validated, PII-stripped event ready for a sink. */
export interface CapturedEvent {
  readonly name: string;
  readonly distinctId: string;
  readonly properties: AnalyticsProperties;
  readonly source: AnalyticsSource;
  readonly userId: string | null;
  readonly anonId: string | null;
}

/** A capture sink (PostHog, local DB, no-op, in-memory test double). */
export interface AnalyticsProvider {
  capture(event: CapturedEvent): Promise<void>;
}
