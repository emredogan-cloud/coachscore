/**
 * Observability wiring (Phase 9) — the activation boundary. Resolves the
 * production logger + error reporter + alerter + heartbeat. Today these use the
 * dependency-free logging-backed implementations; the Sentry and BetterStack
 * adapters drop in here at activation (gated on SENTRY_DSN /
 * BETTERSTACK_HEARTBEAT_URL) behind the same interfaces. Outside coverage.
 */

import { optionalEnv } from '@/lib/env';
import { ConsoleLogSink, StructuredLogger, type LogLevel } from './logger';
import {
  LoggingAlerter,
  LoggingErrorReporter,
  NoopHeartbeat,
  type Alerter,
  type ErrorReporter,
  type HeartbeatReporter,
} from './monitoring';

function present(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '';
}

export function resolveLogger(name = 'coachscore'): StructuredLogger {
  return new StructuredLogger(name, {
    minLevel: optionalEnv('LOG_LEVEL', 'info') as LogLevel,
    sink: new ConsoleLogSink(),
  });
}

/**
 * Logging-backed reporter today; replace with a SentryErrorReporter (implementing
 * `ErrorReporter`) once `@sentry/node` is added and SENTRY_DSN is set.
 */
export function resolveErrorReporter(): ErrorReporter {
  return new LoggingErrorReporter(resolveLogger('errors'));
}

export function resolveAlerter(): Alerter {
  return new LoggingAlerter(resolveLogger('alerts'));
}

/** HTTP heartbeat to BetterStack when configured, else a no-op. */
export class HttpHeartbeat implements HeartbeatReporter {
  constructor(private readonly url: string) {}
  async beat(): Promise<void> {
    await fetch(this.url, { method: 'POST' });
  }
}

export function resolveHeartbeat(): HeartbeatReporter {
  return present('BETTERSTACK_HEARTBEAT_URL')
    ? new HttpHeartbeat(process.env.BETTERSTACK_HEARTBEAT_URL!)
    : new NoopHeartbeat();
}
