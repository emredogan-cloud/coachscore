'use client';

import { useState } from 'react';
import type { Goal } from '@/lib/core';

const GOALS: readonly Goal[] = [
  'rate',
  'progress',
  'war',
  'trophy',
  'derush',
  'recruit',
];

const HEROES: readonly { id: string; label: string }[] = [
  { id: 'barbarianKing', label: 'Barbarian King' },
  { id: 'archerQueen', label: 'Archer Queen' },
  { id: 'grandWarden', label: 'Grand Warden' },
  { id: 'royalChampion', label: 'Royal Champion' },
  { id: 'minionPrince', label: 'Minion Prince' },
  { id: 'dragonDuke', label: 'Dragon Duke' },
];

const num = (value: string, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const inputClass =
  'w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900';

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
  const [townHall, setTownHall] = useState(14);
  const [heroLevels, setHeroLevels] = useState<Record<string, number>>({});
  const [offensePercent, setOffensePercent] = useState(80);
  const [defensePercent, setDefensePercent] = useState(80);
  const [progressionPercent, setProgressionPercent] = useState(90);
  const [wallsAtOrAboveThMax, setWallsAt] = useState(80);
  const [wallsTotal, setWallsTotal] = useState(100);
  const [clan, setClan] = useState(0.5);

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
        offensePercent,
        defensePercent,
        progressionPercent,
        walls: { atOrAboveThMax: wallsAtOrAboveThMax, total: wallsTotal },
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Goal
          <select
            className={inputClass}
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as Goal)}
          >
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Town Hall
          <input
            className={inputClass}
            type="number"
            min={11}
            max={18}
            value={townHall}
            onChange={(e) => setTownHall(num(e.target.value, 14))}
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Hero levels</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HEROES.map((hero) => (
            <label key={hero.id} className="text-xs">
              {hero.label}
              <input
                className={inputClass}
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

      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm">
          Offense %
          <input
            className={inputClass}
            type="number"
            min={0}
            max={100}
            value={offensePercent}
            onChange={(e) => setOffensePercent(num(e.target.value, 0))}
          />
        </label>
        <label className="text-sm">
          Defense %
          <input
            className={inputClass}
            type="number"
            min={0}
            max={100}
            value={defensePercent}
            onChange={(e) => setDefensePercent(num(e.target.value, 0))}
          />
        </label>
        <label className="text-sm">
          Progression %
          <input
            className={inputClass}
            type="number"
            min={0}
            max={100}
            value={progressionPercent}
            onChange={(e) => setProgressionPercent(num(e.target.value, 0))}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm">
          Walls at max
          <input
            className={inputClass}
            type="number"
            min={0}
            value={wallsAtOrAboveThMax}
            onChange={(e) => setWallsAt(num(e.target.value, 0))}
          />
        </label>
        <label className="text-sm">
          Walls total
          <input
            className={inputClass}
            type="number"
            min={0}
            value={wallsTotal}
            onChange={(e) => setWallsTotal(num(e.target.value, 0))}
          />
        </label>
        <label className="text-sm">
          Clan activity (0–1)
          <input
            className={inputClass}
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={clan}
            onChange={(e) => setClan(num(e.target.value, 0))}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {submitting ? 'Scoring…' : 'Get my CoachScore'}
      </button>
    </form>
  );
}
