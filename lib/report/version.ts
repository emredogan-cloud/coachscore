/**
 * Report version locking (Phase 4). A report's identity is the report format
 * version plus the snapshot's locked engine/reference/KB versions and content
 * hash — so a given report is reproducible and adjudicable on facts.
 */

import type { AccountSnapshot } from '@/lib/snapshot';
import type { ReportVersion } from './types';

export const REPORT_FORMAT_VERSION = '1.0.0';

export function buildReportVersion(snapshot: AccountSnapshot): ReportVersion {
  const { engineVersion, referenceTableVersion, knowledgeBaseVersion } =
    snapshot.lock;
  const composite =
    `r${REPORT_FORMAT_VERSION}+e${engineVersion}+ref${referenceTableVersion}` +
    `+kb${knowledgeBaseVersion}+s${snapshot.snapshotHash.slice(0, 12)}`;
  return {
    formatVersion: REPORT_FORMAT_VERSION,
    engineVersion,
    referenceTableVersion,
    knowledgeBaseVersion,
    snapshotHash: snapshot.snapshotHash,
    composite,
  };
}
