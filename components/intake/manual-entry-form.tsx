'use client';

import { useState } from 'react';
import type { Goal } from '@/lib/core';

/**
 * Manual-entry fallback (UX-P0 redesign). The old form exposed raw model inputs
 * ("Offense %", "Clan activity 0–1") that no player knows. This version asks
 * plain-language questions with labelled choices that map to the model values
 * internally — so the manual path is usable, not a developer form. (The primary
 * path is the player tag; this is the "advanced" fallback.) Premium dark-native
 * styling. Same props as before, so report-flow + intake-wizard are unchanged.
 */

const GOALS: readonly { value: Goal; label: string }[] = [
  { value: 'rate', label: 'Rate my account' },
  { value: 'progress', label: 'Steady progress' },
  { value: 'war', label: 'Win wars / CWL' },
  { value: 'trophy', label: 'Push trophies' },
  { value: 'derush', label: 'De-rush' },
  { value: 'recruit', label: 'Get recruited' },
];

const HEROES: readonly { id: string; label: string }[] = [
  { id: 'barbarianKing', label: 'Barbarian King' },
  { id: 'archerQueen', label: 'Archer Queen' },
  { id: 'grandWarden', label: 'Grand Warden' },
  { id: 'royalChampion', label: 'Royal Champion' },
  { id: 'minionPrince', label: 'Minion Prince' },
  { id: 'dragonDuke', label: 'Dragon Duke' },
];

const DEVELOPMENT: readonly { label: string; value: number }[] = [
  { label: 'Just started', value: 35 },
  { label: 'Coming along', value: 60 },
  { label: 'Mostly maxed', value: 82 },
  { label: 'Maxed for my TH', value: 98 },
];
const RUSH: readonly { label: string; value: number }[] = [
  { label: 'Rushed', value: 45 },
  { label: 'A bit behind', value: 70 },
  { label: 'Solid', value: 88 },
  { label: 'Fully caught up', value: 98 },
];
const WALLS: readonly { label: string; value: number }[] = [
  { label: 'Barely any', value: 15 },
  { label: 'Some', value: 45 },
  { label: 'Most', value: 75 },
  { label: 'Nearly all', value: 95 },
];
const CLAN: readonly { label: string; value: number }[] = [
  { label: 'Solo / inactive', value: 0.1 },
  { label: 'Casual', value: 0.4 },
  { label: 'Active', value: 0.7 },
  { label: 'Very active', value: 0.95 },
];

const num = (value: string, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function Choice<T extends number>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-white">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              value === o.value
                ? 'border-brand-violet bg-violet-gradient text-white shadow-glow-violet-sm'
                : 'border-white/10 bg-white/5 text-[var(--fg)]/80 hover:border-brand-violet/40'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const heroInput =
  'mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-violet/50 focus:outline-none';

export function ManualEntryForm({
  goal,
  onGoalChange,
  onSubmit,
  submitting,
}: {
  goal: Goal;
  onGoalChange: (goal: Goal) => void;
  onSubmit: (body: unknown) => void;
  submitting: boolean;
}) {
  const [townHall, setTownHall] = useState(16);
  const [heroLevels, setHeroLevels] = useState<Record<string, number>>({});
  const [offense, setOffense] = useState(60);
  const [defense, setDefense] = useState(60);
  const [progression, setProgression] = useState(88);
  const [wallsPct, setWallsPct] = useState(45);
  const [clan, setClan] = useState(0.4);

  function setHero(id: string, value: string) {
    setHeroLevels((prev) => {
      const next = { ...prev };
      if (value.trim() === '') delete next[id];
      else next[id] = num(value, 0);
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      goal,
      fields: {
        townHall,
        heroLevels,
        offensePercent: offense,
        defensePercent: defense,
        progressionPercent: progression,
        walls: { atOrAboveThMax: wallsPct, total: 100 },
        clan: {
          donationBehavior: clan,
          warContribution: clan,
          capitalContribution: clan,
          activitySignal: clan,
        },
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium text-white">Goal</span>
          <select
            className={heroInput}
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as Goal)}
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value} className="bg-[#0b0a14]">
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-white">Town Hall</span>
          <select
            className={heroInput}
            value={townHall}
            onChange={(e) => setTownHall(num(e.target.value, 16))}
          >
            {Array.from({ length: 8 }, (_, i) => 11 + i).map((th) => (
              <option key={th} value={th} className="bg-[#0b0a14]">
                TH{th}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-white">
          Hero levels (leave blank if not unlocked)
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HEROES.map((hero) => (
            <label key={hero.id} className="text-xs text-[var(--muted)]">
              {hero.label}
              <input
                className={heroInput}
                type="number"
                min={0}
                inputMode="numeric"
                value={heroLevels[hero.id] ?? ''}
                onChange={(e) => setHero(hero.id, e.target.value)}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <Choice
        legend="How developed is your army & lab?"
        options={DEVELOPMENT}
        value={offense}
        onChange={setOffense}
      />
      <Choice
        legend="How maxed are your defenses?"
        options={DEVELOPMENT}
        value={defense}
        onChange={setDefense}
      />
      <Choice
        legend="Vs your previous Town Hall, how caught up are you?"
        options={RUSH}
        value={progression}
        onChange={setProgression}
      />
      <Choice
        legend="How many walls are at your TH max?"
        options={WALLS}
        value={wallsPct}
        onChange={setWallsPct}
      />
      <Choice
        legend="How active are you in your clan?"
        options={CLAN}
        value={clan}
        onChange={setClan}
      />

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-violet-gradient px-5 py-3 font-semibold text-white shadow-glow-violet-sm transition hover:shadow-glow-violet disabled:opacity-50"
      >
        {submitting ? 'Scoring…' : 'Get my CoachScore'}
      </button>
    </form>
  );
}
