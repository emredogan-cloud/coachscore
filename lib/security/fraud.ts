/**
 * Fraud-protection primitives (Phase 9). A pure, weighted heuristic that turns
 * request/behaviour signals into a risk score + level + reasons. Used to gate
 * the abuse-prone surfaces (referral qualification, repeated free submissions,
 * checkout). Deterministic and side-effect-free; the caller decides what to do
 * with a `high` assessment (block, queue for review, require verification).
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export interface FraudSignals {
  readonly submissionsInLastHour?: number;
  readonly disposableEmail?: boolean;
  readonly selfReferral?: boolean;
  readonly referralClaimsInLastDay?: number;
  readonly newAccount?: boolean;
  readonly mismatchedGeo?: boolean;
}

export interface FraudAssessment {
  readonly score: number;
  readonly level: RiskLevel;
  readonly reasons: readonly string[];
}

const SUBMISSION_BURST = 10;
const REFERRAL_BURST = 5;

export function scoreFraud(signals: FraudSignals): FraudAssessment {
  let score = 0;
  const reasons: string[] = [];

  if (signals.selfReferral) {
    score += 60;
    reasons.push('self_referral');
  }
  if (signals.disposableEmail) {
    score += 40;
    reasons.push('disposable_email');
  }
  if ((signals.submissionsInLastHour ?? 0) > SUBMISSION_BURST) {
    score += 30;
    reasons.push('submission_burst');
  }
  if ((signals.referralClaimsInLastDay ?? 0) > REFERRAL_BURST) {
    score += 40;
    reasons.push('referral_burst');
  }
  if (signals.mismatchedGeo) {
    score += 15;
    reasons.push('mismatched_geo');
  }
  if (signals.newAccount) {
    score += 10;
    reasons.push('new_account');
  }

  score = Math.min(100, score);
  const level: RiskLevel =
    score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  return { score, level, reasons };
}
