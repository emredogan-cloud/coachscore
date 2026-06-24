/**
 * Growth dashboard service (Phase 7). Reads the persisted growth tables and
 * aggregates them into the dashboard view. Depends only on the `Repositories`
 * interface, so it is unit-tested with in-memory repos; the handler gates it on
 * the database being activated.
 */

import type { Repositories } from '@/lib/db';
import { buildGrowthDashboard, type GrowthDashboard } from './metrics';

export class GrowthService {
  constructor(private readonly repos: Repositories) {}

  async dashboard(): Promise<GrowthDashboard> {
    const [events, assignments, referrals] = await Promise.all([
      this.repos.analyticsEvents.list(),
      this.repos.experimentAssignments.list(),
      this.repos.referrals.list(),
    ]);
    return buildGrowthDashboard({ events, assignments, referrals });
  }
}
