/**
 * Defense-completion from a screenshot (Feature 2 · P1-C). The official API can't
 * read defenses or walls, so a screenshot (via Anthropic Vision) completes them.
 * This pure module turns the extracted defense/walls signals + a confidence into
 * a completion result, and decides when to ASK THE USER to confirm rather than
 * trust a low-confidence read — never fabricate. Pure + tested.
 */

import { clamp } from '@/lib/core';

export const DEFENSE_CONFIDENCE_THRESHOLD = 0.7;

export interface DefenseExtraction {
  /** 0..100 representative completion of key defenses (from vision OCR). */
  readonly defensePercent: number;
  /** 0..100 share of walls at/above the TH max. */
  readonly wallsAtMaxPercent: number;
  /** 0..1 model confidence in the read. */
  readonly confidence: number;
}

export interface DefenseCompletion {
  readonly defensePercent: number;
  readonly wallsAtMaxPercent: number;
  readonly confidence: number;
  /** True when confidence is too low to trust without user confirmation. */
  readonly needsConfirmation: boolean;
  readonly note: string;
}

export function completeDefense(ext: DefenseExtraction): DefenseCompletion {
  const confidence = clamp(ext.confidence, 0, 1);
  const needsConfirmation = confidence < DEFENSE_CONFIDENCE_THRESHOLD;
  return {
    defensePercent: Math.round(clamp(ext.defensePercent, 0, 100)),
    wallsAtMaxPercent: Math.round(clamp(ext.wallsAtMaxPercent, 0, 100)),
    confidence,
    needsConfirmation,
    note: needsConfirmation
      ? 'We had trouble reading your defenses clearly — please confirm or correct the numbers before we add them.'
      : 'Defenses and walls read from your screenshot and added to your score.',
  };
}
