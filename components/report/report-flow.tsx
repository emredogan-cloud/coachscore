'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Goal } from '@/lib/core';
import type { RenderableReport, ReportTeaser } from '@/lib/report';
import { requestReport, requestReportByTag } from '@/app/report/actions';
import { track } from '@/components/analytics/track';
import { ManualEntryForm } from '@/components/intake/manual-entry-form';
import { ShareButtons } from '@/components/share/share-buttons';
import { ReportView } from './report-view';
import { TeaserView } from './teaser-view';

interface ScoredResponse {
  teaser: ReportTeaser;
  report: RenderableReport | null;
  access: { full: boolean; reason: string };
  source?: 'tag' | 'manual';
  playerTag?: string;
  fieldsNeedingConfirmation?: string[];
}

interface FallbackResponse {
  fallbackToManual: true;
  message?: string;
}

const GOALS: readonly { value: Goal; label: string }[] = [
  { value: 'rate', label: 'Rate my account' },
  { value: 'war', label: 'Win wars / CWL' },
  { value: 'trophy', label: 'Push trophies' },
  { value: 'derush', label: 'De-rush' },
  { value: 'recruit', label: 'Get recruited' },
  { value: 'progress', label: 'Steady progress' },
];

const primaryBtn =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-gradient px-5 py-3 font-semibold text-white shadow-glow-violet-sm transition hover:shadow-glow-violet disabled:opacity-50';
const ghostBtn =
  'inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--fg)]/90 transition hover:border-brand-violet/40 hover:text-white';

type LastInput =
  | { kind: 'tag'; tag: string; goal: Goal }
  | { kind: 'manual'; body: Record<string, unknown> };

/**
 * The magic moment: paste a player tag → "Analyze My Account" → instant
 * objective score (the free teaser), then share or unlock the full report.
 * Manual entry is the ADVANCED fallback — shown only if the user opts in or the
 * official API can't be reached. Premium, dark-native styling throughout.
 */
export function ReportFlow() {
  const [mode, setMode] = useState<'tag' | 'manual'>('tag');
  const [tag, setTag] = useState('');
  const [goal, setGoal] = useState<Goal>('rate');
  const [data, setData] = useState<ScoredResponse | null>(null);
  const [last, setLast] = useState<LastInput | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function applyResult(body: unknown, input: LastInput): boolean {
    const maybe = body as Partial<FallbackResponse> & Partial<ScoredResponse>;
    if (maybe.fallbackToManual === true) {
      setMode('manual');
      setNote(maybe.message ?? 'Enter your details manually.');
      return false;
    }
    const scored = body as ScoredResponse;
    setData(scored);
    setLast(input);
    track('score_generated', {
      grade: scored.teaser.grade,
      overall: scored.teaser.overall,
      th: scored.teaser.townHall,
      source: input.kind,
    });
    return true;
  }

  async function analyzeTag() {
    const trimmed = tag.trim();
    if (trimmed === '') {
      setError('Enter your player tag (e.g. #2PP0LYQ).');
      return;
    }
    setSubmitting(true);
    setError(null);
    setNote(null);
    track('tag_submitted', { goal });
    try {
      const res = await requestReportByTag({ playerTag: trimmed, goal });
      if (res.status === 200) {
        applyResult(res.body, { kind: 'tag', tag: trimmed, goal });
      } else {
        const b = res.body as { error?: { message?: string } };
        setError(
          b.error?.message ?? `We couldn't read that tag (${res.status}).`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitManual(body: unknown) {
    const b = body as Record<string, unknown>;
    setSubmitting(true);
    setError(null);
    try {
      const res = await requestReport(b);
      if (res.status === 200) {
        applyResult(res.body, { kind: 'manual', body: b });
      } else {
        const e = res.body as { error?: { message?: string } };
        setError(e.error?.message ?? `Request failed (${res.status}).`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function previewFull() {
    if (last === null) return;
    setSubmitting(true);
    try {
      const res =
        last.kind === 'tag'
          ? await requestReportByTag({
              playerTag: last.tag,
              goal: last.goal,
              preview: true,
            })
          : await requestReport({ ...last.body, preview: true });
      if (res.status === 200) {
        const scored = res.body as ScoredResponse;
        setData(scored);
        if (scored.report !== null) {
          track('report_delivered', { grade: scored.teaser.grade });
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setData(null);
    setLast(null);
    setError(null);
    setNote(null);
    setTag('');
  }

  // ---- Result view (teaser / full report + share) -------------------------
  if (data !== null) {
    const t = data.teaser;
    const shareUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://coachscore.app';
    const shareText = `I scored Grade ${t.grade} (${t.overall}/100) on CoachScore — rate your Clash of Clans account free:`;
    const cardUrl = `/api/share/og?grade=${t.grade}&overall=${t.overall}&th=${t.townHall}&goal=${t.goal}`;
    const missing = (data.fieldsNeedingConfirmation ?? []).filter(
      (f) => f === 'defense' || f === 'walls',
    );

    return (
      <div className="space-y-6">
        {data.report !== null ? (
          <ReportView report={data.report} />
        ) : (
          <TeaserView teaser={t} />
        )}

        {missing.length > 0 ? (
          <p className="rounded-xl border border-brand-violet/20 bg-brand-violet/5 p-3 text-xs text-[var(--muted)]">
            Your {missing.join(' & ')} couldn&apos;t be read from your player
            tag (the game API doesn&apos;t expose base layout). Your score
            covers heroes, army, equipment, progression &amp; clan — the
            dimensions we can read objectively.
          </p>
        ) : null}

        {/* Share — directly below the free score (the growth loop) */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
            Share your grade
          </h3>
          <ShareButtons url={shareUrl} text={shareText} imageUrl={cardUrl} />
        </div>

        <div className="flex flex-wrap gap-3">
          {data.report === null ? (
            <button
              type="button"
              onClick={() => void previewFull()}
              disabled={submitting}
              className={primaryBtn}
            >
              {submitting ? 'Loading…' : 'Preview the full report'}
            </button>
          ) : null}
          <Link href="/pricing" className={ghostBtn}>
            See pricing
          </Link>
          <button type="button" onClick={reset} className={ghostBtn}>
            Start over
          </button>
        </div>

        {data.report !== null && data.access.reason === 'preview' ? (
          <p className="text-xs text-amber-300/80">
            Preview — shown for demonstration. Payments are not activated, so no
            purchase was made.
          </p>
        ) : null}
      </div>
    );
  }

  // ---- Manual fallback ----------------------------------------------------
  if (mode === 'manual') {
    return (
      <div className="space-y-4">
        {note !== null ? (
          <p className="rounded-xl border border-brand-violet/20 bg-brand-violet/5 p-3 text-sm text-[var(--fg)]/90">
            {note}
          </p>
        ) : null}
        {error !== null ? (
          <p
            role="alert"
            className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}
        <ManualEntryForm
          goal={goal}
          onGoalChange={setGoal}
          onSubmit={(b) => void submitManual(b)}
          submitting={submitting}
        />
        <button
          type="button"
          onClick={() => {
            setMode('tag');
            setNote(null);
            setError(null);
          }}
          className="text-sm text-brand-violet-light underline hover:text-white"
        >
          ← Use my player tag instead
        </button>
      </div>
    );
  }

  // ---- Primary: tag-first magic moment ------------------------------------
  return (
    <div className="space-y-5">
      {error !== null ? (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="player-tag"
          className="block text-sm font-medium text-white"
        >
          Your Clash of Clans player tag
        </label>
        <input
          id="player-tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void analyzeTag();
          }}
          placeholder="#2PP0LYQ"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg font-semibold tracking-[0.15em] text-white placeholder:text-[var(--muted)] focus:border-brand-violet/50 focus:outline-none focus:ring-1 focus:ring-brand-violet/40"
        />
        <p className="text-xs text-[var(--muted)]">
          In game: tap your profile — your tag is under your name (starts with
          #).
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">
          What&apos;s your goal?
        </span>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value as Goal)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-violet/50 focus:outline-none"
        >
          {GOALS.map((g) => (
            <option key={g.value} value={g.value} className="bg-[#0b0a14]">
              {g.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => void analyzeTag()}
        disabled={submitting}
        className={primaryBtn}
      >
        {submitting ? 'Analyzing…' : 'Analyze My Account'}
      </button>

      <p className="text-center text-xs text-[var(--muted)]">
        Free · no account needed · objective, from your in-game data.
      </p>

      <button
        type="button"
        onClick={() => setMode('manual')}
        className="mx-auto block text-sm text-brand-violet-light underline hover:text-white"
      >
        Enter my details manually instead
      </button>
    </div>
  );
}
