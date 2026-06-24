/**
 * Health report (Phase 9) — the data behind the health endpoint + admin health
 * dashboard. Aggregates the activation matrix (which credential-gated subsystems
 * are live) + observability wiring + the app env. Pure read of activation
 * predicates + env, so it is unit-testable.
 */

import { activationStatus } from '@/lib/activation';
import { appConfig } from '@/lib/env';

function present(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '';
}

export interface SubsystemHealth {
  readonly name: string;
  readonly configured: boolean;
}

export interface HealthReport {
  readonly status: 'ok';
  readonly env: string;
  readonly subsystems: readonly SubsystemHealth[];
  readonly observability: {
    readonly errorMonitoring: boolean;
    readonly uptime: boolean;
  };
  /** Count of activated subsystems (excludes observability). */
  readonly activatedCount: number;
}

export function healthReport(): HealthReport {
  const activation = activationStatus();
  const subsystems: SubsystemHealth[] = Object.entries(activation).map(
    ([name, configured]) => ({ name, configured }),
  );
  return {
    status: 'ok',
    env: appConfig.env,
    subsystems,
    observability: {
      errorMonitoring: present('SENTRY_DSN'),
      uptime: present('BETTERSTACK_HEARTBEAT_URL'),
    },
    activatedCount: subsystems.filter((s) => s.configured).length,
  };
}
