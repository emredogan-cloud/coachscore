/**
 * Monitoring abstractions (Phase 9): error reporting (Sentry boundary), alerting,
 * and uptime heartbeats. Each is an interface with a no-op default + a
 * logging-backed implementation that works dependency-free today. The concrete
 * Sentry / BetterStack adapters implement these same interfaces at activation
 * (gated on SENTRY_DSN / BETTERSTACK_HEARTBEAT_URL) — no faked calls before then.
 */

import type { StructuredLogger } from './logger';

export type ErrorContext = Readonly<Record<string, unknown>>;

export interface ErrorReporter {
  captureException(error: unknown, context?: ErrorContext): void;
  captureMessage(message: string, context?: ErrorContext): void;
}

export class NoopErrorReporter implements ErrorReporter {
  captureException(_error: unknown, _context?: ErrorContext): void {}
  captureMessage(_message: string, _context?: ErrorContext): void {}
}

/** Reports through the structured logger — the dependency-free default. */
export class LoggingErrorReporter implements ErrorReporter {
  constructor(private readonly logger: StructuredLogger) {}
  captureException(error: unknown, context?: ErrorContext): void {
    this.logger.error(error instanceof Error ? error.message : String(error), {
      ...context,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
  captureMessage(message: string, context?: ErrorContext): void {
    this.logger.error(message, context);
  }
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alerter {
  alert(
    severity: AlertSeverity,
    message: string,
    context?: ErrorContext,
  ): Promise<void>;
}

export class NoopAlerter implements Alerter {
  async alert(): Promise<void> {}
}

export class LoggingAlerter implements Alerter {
  constructor(private readonly logger: StructuredLogger) {}
  async alert(
    severity: AlertSeverity,
    message: string,
    context?: ErrorContext,
  ): Promise<void> {
    const text = `[alert:${severity}] ${message}`;
    if (severity === 'critical') this.logger.error(text, context);
    else this.logger.warn(text, context);
  }
}

export interface HeartbeatReporter {
  beat(): Promise<void>;
}

export class NoopHeartbeat implements HeartbeatReporter {
  async beat(): Promise<void> {}
}
