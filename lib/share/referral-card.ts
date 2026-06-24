/**
 * Referral share card (Phase 7). Composes a referral link (`/r/CODE` + UTM/ref
 * attribution) with share copy tuned to the two roadmap share psychologies:
 * status-flex when a high grade is present (Maxer Mike), help-seeking otherwise
 * (Returning Ryan). Returns ready-to-render social targets. Pure.
 */

import {
  buildShareTargets,
  withShareAttribution,
  type ShareTarget,
} from './social';

export interface ReferralShareInput {
  readonly appUrl: string;
  readonly code: string;
  readonly grade?: string;
  readonly townHall?: number;
  /** Percentile rank, e.g. 12 → "Top 12%". */
  readonly percentile?: number;
  readonly campaign?: string;
}

export interface ReferralShare {
  readonly url: string;
  readonly text: string;
  readonly targets: readonly ShareTarget[];
}

export function buildReferralShareText(input: ReferralShareInput): string {
  if (input.grade && input.townHall && input.percentile !== undefined) {
    return (
      `I scored Grade ${input.grade} (Top ${input.percentile}% of TH${input.townHall}) ` +
      `on CoachScore — rate your Clash of Clans account free:`
    );
  }
  if (input.grade) {
    return `I scored Grade ${input.grade} on CoachScore — get your Clash of Clans account rated free:`;
  }
  return `Rate your Clash of Clans account and get a free upgrade roadmap on CoachScore:`;
}

export function buildReferralShare(input: ReferralShareInput): ReferralShare {
  const base = `${input.appUrl.replace(/\/$/, '')}/r/${input.code}`;
  const url = withShareAttribution(base, {
    source: 'referral',
    medium: 'share',
    campaign: input.campaign,
    ref: input.code,
  });
  const text = buildReferralShareText(input);
  return { url, text, targets: buildShareTargets({ url, text }) };
}
