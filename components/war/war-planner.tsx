'use client';

import { useState } from 'react';
import { assessWarReadiness, type WarGoal, type WarReadiness } from '@/lib/war';
import { PremiumCard, ScoreRing } from '@/components/ui';

/**
 * War Intelligence UI (Feature 1). A coarse, plain-language input (Town Hall +
 * hero levels + army development + goal) drives the deterministic war engine —
 * computed client-side (pure, no API) — and renders a premium readiness ring,
 * meta-army cards, missing requirements, upgrade priorities, and an ETA. The
 * tag/API path can later feed granular unit levels for sharper results.
 */
const HEROES: readonly { id: string; label: string }[] = [
  { id: 'barbarianKing', label: 'Barbarian King' },
  { id: 'archerQueen', label: 'Archer Queen' },
  { id: 'grandWarden', label: 'Grand Warden' },
  { id: 'royalChampion', label: 'Royal Champion' },
  { id: 'minionPrince', label: 'Minion Prince' },
  { id: 'dragonDuke', label: 'Dragon Duke' },
];
const GOALS: readonly { value: WarGoal; label: string }[] = [
  { value: 'war', label: 'War' },
  { value: 'cwl', label: 'CWL' },
  { value: 'trophy', label: 'Trophy push' },
  { value: 'legends', label: 'Legends' },
  { value: 'farming', label: 'Farming' },
];
const DEV: readonly { label: string; value: number }[] = [
  { label: 'Just started', value: 35 },
  { label: 'Coming along', value: 60 },
  { label: 'Mostly maxed', value: 82 },
  { label: 'Maxed', value: 98 },
];

const field =
  'mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-violet/50 focus:outline-none';

export function WarPlanner() {
  const [townHall, setTownHall] = useState(16);
  const [goal, setGoal] = useState<WarGoal>('war');
  const [labLevelPct, setLab] = useState(82);
  const [heroLevels, setHeroLevels] = useState<Record<string, number>>({});
  const [result, setResult] = useState<WarReadiness | null>(null);

  function setHero(id: string, v: string) {
    setHeroLevels((p) => {
      const n = { ...p };
      if (v.trim() === '') delete n[id];
      else n[id] = Math.max(0, Number(v) || 0);
      return n;
    });
  }

  function analyze() {
    setResult(assessWarReadiness({ townHall, heroLevels, labLevelPct, goal }));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="font-medium text-white">Town Hall</span>
            <select
              className={field}
              value={townHall}
              onChange={(e) => setTownHall(Number(e.target.value))}
            >
              {Array.from({ length: 8 }, (_, i) => 11 + i).map((th) => (
                <option key={th} value={th} className="bg-[#0b0a14]">
                  TH{th}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-white">Goal</span>
            <select
              className={field}
              value={goal}
              onChange={(e) => setGoal(e.target.value as WarGoal)}
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value} className="bg-[#0b0a14]">
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-white">
            Hero levels
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {HEROES.map((h) => (
              <label key={h.id} className="text-xs text-[var(--muted)]">
                {h.label}
                <input
                  className={field}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={heroLevels[h.id] ?? ''}
                  onChange={(e) => setHero(h.id, e.target.value)}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-white">
            How developed is your army &amp; lab?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEV.map((d) => (
              <button
                key={d.label}
                type="button"
                aria-pressed={labLevelPct === d.value}
                onClick={() => setLab(d.value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  labLevelPct === d.value
                    ? 'border-brand-violet bg-violet-gradient text-white'
                    : 'border-white/10 bg-white/5 text-[var(--fg)]/80 hover:border-brand-violet/40'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={analyze}
          className="inline-flex w-full items-center justify-center rounded-xl bg-violet-gradient px-5 py-3 font-semibold text-white shadow-glow-violet-sm transition hover:shadow-glow-violet"
        >
          Analyze my war readiness
        </button>
      </div>

      {result !== null ? (
        <div className="space-y-5">
          <PremiumCard tone="gold" glowed className="p-6">
            <div className="flex items-center justify-center gap-5">
              <ScoreRing
                value={result.score}
                grade={result.tier === 'Elite War Ready' ? 'S' : undefined}
                size={116}
                label="War readiness"
              />
              <div className="text-left">
                <p className="text-2xl font-extrabold text-gold-gradient">
                  {result.tier}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Projected: {result.warTier}
                </p>
                {result.timeToReadyDays !== null &&
                result.timeToReadyDays > 0 ? (
                  <p className="text-xs text-[var(--muted)]">
                    ~{result.timeToReadyDays} days to war-ready
                  </p>
                ) : null}
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-[var(--fg)]/90">
              {result.explanation}
            </p>
          </PremiumCard>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
              Recommended armies
            </h3>
            <ul className="mt-3 space-y-2.5">
              {result.recommendedArmies.map((a) => (
                <li key={a.id}>
                  <PremiumCard tone="violet" className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-white">{a.name}</h4>
                      <span className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold text-brand-gold-light">
                          Tier {a.tier}
                        </span>
                        <span
                          className={
                            a.ready ? 'text-emerald-400' : 'text-amber-300'
                          }
                        >
                          {a.ready ? 'Ready' : `${a.fit}% fit`}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{a.why}</p>
                    {a.missing.length > 0 ? (
                      <ul className="mt-2 space-y-0.5 text-xs text-amber-300/90">
                        {a.missing.map((m) => (
                          <li key={m}>• {m}</li>
                        ))}
                      </ul>
                    ) : null}
                  </PremiumCard>
                </li>
              ))}
            </ul>
          </div>

          {result.upgradePriorities.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
                Upgrade priorities for attacking
              </h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--fg)]/90">
                {result.upgradePriorities.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
