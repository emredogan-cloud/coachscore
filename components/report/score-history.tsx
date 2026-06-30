'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  summarizeProgress,
  type ProgressSummary,
  type ScoreEntry,
} from '@/lib/history';

/**
 * P1-A retention spine + EMO-P1 rituals (client, localStorage-backed). Records
 * each score for a player tag and shows progress over time — delta vs last
 * check, personal best, and celebrated milestones ("New personal best", "Grade
 * up", "De-rushed"). This is the "watch your grade climb" loop that turns an
 * episodic tool into a recurring one. A DB-backed, cross-device version is the
 * documented follow-up (sandbox DB host unreachable). Degrades silently if
 * localStorage is blocked.
 */
const KEY = 'cs_history';

function load(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}
function persist(list: ScoreEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* storage blocked → no-op */
  }
}

export function ScoreHistory({ entry }: { entry: Omit<ScoreEntry, 'at'> }) {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    const all = load();
    const forTag = all.filter((x) => x.tag === entry.tag);
    const last = forTag[forTag.length - 1];
    const now = Date.now();
    // Dedupe a re-render double-save: same tag + same score within 60s.
    const isDuplicate =
      last && last.overall === entry.overall && now - last.at < 60_000;
    const next = isDuplicate ? all : [...all, { ...entry, at: now }];
    if (!isDuplicate) persist(next);
    setSummary(summarizeProgress(next.filter((x) => x.tag === entry.tag)));
  }, [
    entry.tag,
    entry.overall,
    entry.grade,
    entry.townHall,
    entry.goal,
    entry.rushLabel,
  ]);

  if (summary === null) return null;

  if (summary.count <= 1) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Saved to this device — re-check after your next upgrade to watch your
        grade climb.{' '}
        <Link
          href="/settings/notifications"
          className="text-brand-violet-light hover:text-white"
        >
          Get reminded →
        </Link>
      </p>
    );
  }

  const delta = summary.overallDelta ?? 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-violet-light">
          Your progress
        </h3>
        <span className="text-xs text-[var(--muted)]">
          {summary.count} check-ins
        </span>
      </div>
      <p className="mt-1.5 text-sm text-[var(--fg)]/90">
        Since last time:{' '}
        <span
          className={
            delta > 0
              ? 'font-semibold text-emerald-400'
              : delta < 0
                ? 'font-semibold text-orange-400'
                : 'font-semibold text-white'
          }
        >
          {delta > 0 ? `+${delta}` : delta} pts
        </span>{' '}
        · best {summary.best}/100
      </p>
      {summary.milestones.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {summary.milestones.map((m) => (
            <li
              key={m}
              className="rounded-full border border-brand-gold/30 bg-brand-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-gold-light"
            >
              🏆 {m}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
