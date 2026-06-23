/**
 * Share-card data (Phase 4). Pure builder for the social/OG card shown when a
 * result is shared. The OG image route (app/api/share/og) renders this.
 */

import type { Goal, Grade } from '@/lib/core';

export interface ShareCardInput {
  readonly grade: Grade;
  readonly overall: number;
  readonly townHall: number;
  readonly goal: Goal;
}

export interface ShareCard extends ShareCardInput {
  readonly headline: string;
  readonly subtitle: string;
}

export function buildShareCard(input: ShareCardInput): ShareCard {
  return {
    ...input,
    headline: `Grade ${input.grade} · ${input.overall}/100`,
    subtitle: `Town Hall ${input.townHall} · goal: ${input.goal}`,
  };
}
