'use client';

import { useState } from 'react';
import { assessWarReadiness, type WarGoal, type WarReadiness } from '@/lib/war';
import {
  EyebrowPill,
  MagicButton,
  PremiumCard,
  ScoreRing,
  SectionDivider,
  StatusBadge,
  TrustBar,
  type TrustItem,
} from '@/components/ui';

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

type BadgeTone = 'gold' | 'success' | 'info' | 'warning' | 'inactive';

/** Readiness tier → readiness-card StatusBadge tone (presentation only). */
const READINESS_TONE: Record<string, BadgeTone> = {
  'Elite War Ready': 'gold',
  'War Ready': 'success',
  'Partially Ready': 'warning',
  'Not Ready': 'inactive',
};

/** Army tier letter → its StatusBadge tone (S/A gold-green, B violet, else warn). */
function armyTierTone(tier: string): BadgeTone {
  const t = tier.trim().toUpperCase().charAt(0);
  if (t === 'S') return 'gold';
  if (t === 'A') return 'success';
  if (t === 'B') return 'info';
  return 'warning';
}

/**
 * IP-SAFE abstract army emblem — a deterministic CSS/SVG crest, NOT Clash troop
 * art. A rotated gem core over concentric arcs; hue is seeded from the army id
 * so each army reads as a distinct sigil while staying on the violet→gold brand.
 * Pure, hook-free, decorative (aria-hidden).
 */
function ArmyEmblem({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = 250 + (h % 80); // violet (250) → gold-ish (330), brand-aligned
  const a = `hsl(${hue} 70% 62%)`;
  const b = `hsl(${(hue + 40) % 360} 75% 56%)`;
  return (
    <span
      aria-hidden
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]"
    >
      <svg viewBox="0 0 40 40" className="h-7 w-7">
        <defs>
          <linearGradient id={`ae-${h}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />
        <path
          d={`M20 7 A13 13 0 0 1 ${20 + 13 * Math.sin((h % 6) + 1)} ${20 - 13 * Math.cos((h % 6) + 1)}`}
          fill="none"
          stroke={`url(#ae-${h})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect
          x="13"
          y="13"
          width="14"
          height="14"
          rx="3"
          transform="rotate(45 20 20)"
          fill={`url(#ae-${h})`}
          opacity="0.9"
        />
      </svg>
    </span>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-[var(--muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

const TRUST_ITEMS: readonly TrustItem[] = [
  {
    title: 'Deterministic',
    subtitle: 'Same inputs, same plan',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l7 3v6c0 4-3 6-7 9-4-3-7-5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Patch-aware',
    subtitle: 'Tuned to the current meta',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
    ),
  },
  {
    title: 'Fieldable only',
    subtitle: 'Never an impossible army',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  {
    title: 'Goal-aware',
    subtitle: 'War · CWL · trophy · more',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.5" />
      </svg>
    ),
  },
];

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

        <MagicButton type="button" variant="violet" size="lg" onClick={analyze}>
          Analyze my war readiness
        </MagicButton>
      </div>

      {result !== null ? (
        <div className="space-y-6">
          <PremiumCard tone="gold" glowed className="p-6">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
              <ScoreRing
                value={result.score}
                grade={result.tier === 'Elite War Ready' ? 'S' : undefined}
                size={116}
                label="War readiness"
              />
              <div className="text-center sm:text-left">
                <EyebrowPill tone="gold">War readiness</EyebrowPill>
                <p className="mt-2 text-2xl font-extrabold text-gold-gradient">
                  {result.tier}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <StatusBadge tone={READINESS_TONE[result.tier] ?? 'inactive'}>
                    {result.tier}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Projected: {result.warTier}
                  {result.timeToReadyDays !== null &&
                  result.timeToReadyDays > 0 ? (
                    <>
                      {' · '}~{result.timeToReadyDays} days to war-ready
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            <p className="mt-5 rounded-xl border border-brand-gold/20 bg-brand-gold/[0.06] px-4 py-3 text-center text-sm leading-relaxed text-[var(--fg)]/90">
              {result.explanation}
            </p>
          </PremiumCard>

          <div>
            <SectionDivider className="mb-4">Recommended armies</SectionDivider>
            <ul className="space-y-2.5">
              {result.recommendedArmies.map((a) => (
                <li key={a.id}>
                  <PremiumCard tone="violet" className="p-4">
                    <div className="flex items-start gap-3">
                      <ArmyEmblem seed={a.id} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-white">{a.name}</h4>
                          <div className="flex shrink-0 items-center gap-2 text-xs">
                            <StatusBadge tone={armyTierTone(a.tier)}>
                              Tier {a.tier}
                            </StatusBadge>
                            <span
                              className={`font-semibold ${
                                a.ready ? 'text-emerald-400' : 'text-amber-300'
                              }`}
                            >
                              {a.ready ? 'Ready' : `${a.fit}% fit`}
                            </span>
                            <Chevron />
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {a.why}
                        </p>
                        {a.missing.length > 0 ? (
                          <ul className="mt-2 space-y-0.5 text-xs text-brand-gold-light/90">
                            {a.missing.map((m) => (
                              <li key={m}>• {m}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </PremiumCard>
                </li>
              ))}
            </ul>
          </div>

          {result.upgradePriorities.length > 0 ? (
            <div>
              <SectionDivider className="mb-4">
                Upgrade priorities for attacking
              </SectionDivider>
              <ol className="space-y-2.5">
                {result.upgradePriorities.map((u, i) => (
                  <li key={u}>
                    <PremiumCard
                      tone="plain"
                      className="flex items-center gap-3 p-4"
                    >
                      <span
                        aria-hidden
                        className="relative flex h-9 w-9 shrink-0 items-center justify-center"
                      >
                        <span className="absolute inset-0 rotate-45 rounded-[10px] bg-violet-gradient shadow-glow-violet-sm" />
                        <span className="relative text-sm font-extrabold text-white">
                          {i + 1}
                        </span>
                      </span>
                      <p className="text-sm leading-snug text-[var(--fg)]/90">
                        {u}
                      </p>
                    </PremiumCard>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-center text-xs text-[var(--muted)]">
                Each finished upgrade adds to your TH cap — closing the gap to a
                maxed, war-ready base.
              </p>
            </div>
          ) : null}

          <TrustBar items={TRUST_ITEMS} />
        </div>
      ) : null}
    </div>
  );
}
