/**
 * Package comparison matrix (Phase 4) for the pricing page. Each row is a
 * feature with a per-SKU cell (true = included, string = qualifier, false = no).
 */

import type { SkuId } from './types';

export interface ComparisonRow {
  readonly feature: string;
  readonly cells: Readonly<Record<SkuId, boolean | string>>;
}

const ALL = {
  free: true,
  basic: true,
  standard: true,
  pro: true,
  account_rescue: true,
  clan: true,
} as const;

export const COMPARISON: readonly ComparisonRow[] = [
  { feature: 'Overall score + grade', cells: { ...ALL } },
  {
    feature: 'All sub-scores',
    cells: {
      free: false,
      basic: true,
      standard: true,
      pro: true,
      account_rescue: true,
      clan: true,
    },
  },
  {
    feature: 'AI upgrade roadmap',
    cells: {
      free: false,
      basic: true,
      standard: true,
      pro: true,
      account_rescue: true,
      clan: true,
    },
  },
  {
    feature: 'Human coach review',
    cells: {
      free: false,
      basic: false,
      standard: true,
      pro: 'Senior',
      account_rescue: true,
      clan: true,
    },
  },
  {
    feature: 'PDF export',
    cells: {
      free: false,
      basic: true,
      standard: true,
      pro: true,
      account_rescue: true,
      clan: true,
    },
  },
  {
    feature: 'De-rush plan',
    cells: {
      free: false,
      basic: false,
      standard: false,
      pro: false,
      account_rescue: true,
      clan: false,
    },
  },
  {
    feature: 'Per-seat / roster',
    cells: {
      free: false,
      basic: false,
      standard: false,
      pro: false,
      account_rescue: false,
      clan: true,
    },
  },
];
