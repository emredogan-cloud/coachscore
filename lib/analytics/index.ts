export type {
  AnalyticsValue,
  AnalyticsProperties,
  AnalyticsSource,
  AnalyticsContext,
  AnalyticsEvent,
  CapturedEvent,
  AnalyticsProvider,
} from './types';
export {
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_EVENTS,
  isAnalyticsEventName,
  eventsByCategory,
  stripPii,
  PII_PROPERTY_KEYS,
  type AnalyticsEventName,
  type EventCategory,
  type PiiScrubResult,
} from './taxonomy';
export {
  ACQUISITION_FUNNEL,
  PRODUCT_FUNNEL,
  VIRAL_FUNNEL,
  FUNNELS,
  computeFunnel,
  type FunnelDef,
  type FunnelStep,
  type FunnelResult,
  type FunnelStepResult,
} from './funnel';
export {
  NoopAnalyticsProvider,
  MemoryAnalyticsProvider,
  CompositeAnalyticsProvider,
} from './provider';
export {
  PostHogProvider,
  createPostHogProvider,
  defaultAnalyticsProvider,
} from './posthog-adapter';
export {
  AnalyticsService,
  AnalyticsError,
  type AnalyticsServiceDeps,
} from './service';
