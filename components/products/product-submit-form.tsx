'use client';

import { useState } from 'react';
import { requestProductSubmit } from '@/app/products/actions';
import type { ProductReportView, ProductSku } from '@/lib/products';
import { ProductReportViewCard } from './product-report-view';

type FieldKind = 'number' | 'select' | 'boolean' | 'text';

interface Field {
  readonly key: string;
  readonly label: string;
  readonly kind: FieldKind;
  readonly options?: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly min?: number;
  readonly max?: number;
  readonly default?: string | boolean;
}

const ENUM = (...vals: string[]) =>
  vals.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));

const FIELD_SETS: Record<ProductSku, readonly Field[]> = {
  replay_doctor: [
    {
      key: 'townHall',
      label: 'Town Hall',
      kind: 'number',
      min: 1,
      max: 20,
      default: '14',
    },
    {
      key: 'context',
      label: 'Attack context',
      kind: 'select',
      options: ENUM('war', 'multiplayer', 'cwl', 'friendly'),
    },
    {
      key: 'starsEarned',
      label: 'Stars earned',
      kind: 'number',
      min: 0,
      max: 3,
      default: '2',
    },
    {
      key: 'destructionPct',
      label: 'Destruction %',
      kind: 'number',
      min: 0,
      max: 100,
      default: '80',
    },
    {
      key: 'durationSec',
      label: 'Attack duration (sec)',
      kind: 'number',
      min: 0,
      max: 600,
      default: '180',
    },
    {
      key: 'timeRemainingSec',
      label: 'Time remaining (sec)',
      kind: 'number',
      min: 0,
      max: 600,
      default: '30',
    },
  ],
  base_doctor: [
    {
      key: 'townHall',
      label: 'Town Hall',
      kind: 'number',
      min: 1,
      max: 20,
      default: '14',
    },
    {
      key: 'layoutType',
      label: 'Layout type',
      kind: 'select',
      options: ENUM('war', 'farm', 'hybrid', 'trophy'),
    },
    {
      key: 'goal',
      label: 'Defense goal',
      kind: 'select',
      options: ENUM(
        'war_defense',
        'trophy_push',
        'resource_protection',
        'general',
      ),
    },
    {
      key: 'townHallCentralized',
      label: 'Town Hall centralized',
      kind: 'boolean',
      default: true,
    },
    {
      key: 'airDefenseCount',
      label: 'Air defenses',
      kind: 'number',
      min: 0,
      max: 12,
      default: '4',
    },
    {
      key: 'airDefenseSpread',
      label: 'Air defenses spread out',
      kind: 'boolean',
      default: true,
    },
    {
      key: 'trapCount',
      label: 'Traps placed',
      kind: 'number',
      min: 0,
      max: 60,
      default: '12',
    },
    {
      key: 'wallsMaxed',
      label: 'Walls maxed for TH',
      kind: 'boolean',
      default: false,
    },
  ],
  war_plan: [
    {
      key: 'attackerTownHall',
      label: 'Your Town Hall',
      kind: 'number',
      min: 1,
      max: 20,
      default: '14',
    },
    {
      key: 'defenderTownHall',
      label: 'Enemy Town Hall',
      kind: 'number',
      min: 1,
      max: 20,
      default: '14',
    },
    {
      key: 'defenderBaseType',
      label: 'Enemy base type',
      kind: 'select',
      options: ENUM(
        'ring',
        'compartment',
        'anti_air',
        'anti_ground',
        'unknown',
      ),
    },
    {
      key: 'objective',
      label: 'Objective',
      kind: 'select',
      options: ENUM('three_star', 'two_star', 'cleanup'),
    },
    {
      key: 'rosterArmy',
      label: 'Your army composition',
      kind: 'text',
      default: '',
    },
    {
      key: 'rosterStrength',
      label: 'Army strength',
      kind: 'select',
      options: ENUM('low', 'medium', 'high'),
    },
  ],
};

function initialValues(sku: ProductSku): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const f of FIELD_SETS[sku]) {
    if (f.kind === 'boolean') out[f.key] = f.default === true;
    else if (f.kind === 'select') out[f.key] = f.options?.[0]?.value ?? '';
    else out[f.key] = typeof f.default === 'string' ? f.default : '';
  }
  return out;
}

function num(v: string | boolean | undefined): number {
  return typeof v === 'string' ? Number(v) : 0;
}

/** Map the flat form state to the SKU-specific, schema-shaped input object. */
function assembleInput(
  sku: ProductSku,
  v: Record<string, string | boolean>,
): unknown {
  switch (sku) {
    case 'replay_doctor':
      return {
        townHall: num(v.townHall),
        context: v.context,
        starsEarned: num(v.starsEarned),
        destructionPct: num(v.destructionPct),
        durationSec: num(v.durationSec),
        timeRemainingSec: num(v.timeRemainingSec),
      };
    case 'base_doctor':
      return {
        townHall: num(v.townHall),
        layoutType: v.layoutType,
        goal: v.goal,
        townHallCentralized: v.townHallCentralized === true,
        airDefenseCount: num(v.airDefenseCount),
        airDefenseSpread: v.airDefenseSpread === true,
        trapCount: num(v.trapCount),
        wallsMaxed: v.wallsMaxed === true,
      };
    case 'war_plan':
      return {
        attackerTownHall: num(v.attackerTownHall),
        defenderTownHall: num(v.defenderTownHall),
        defenderBaseType: v.defenderBaseType,
        objective: v.objective,
        roster: {
          army: typeof v.rosterArmy === 'string' ? v.rosterArmy : '',
          armyStrength: v.rosterStrength,
        },
      };
  }
}

type Status = 'idle' | 'loading' | 'error';

export function ProductSubmitForm({ sku }: { sku: ProductSku }) {
  const [values, setValues] = useState(() => initialValues(sku));
  const [context, setContext] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [report, setReport] = useState<ProductReportView | null>(null);
  const [persistNote, setPersistNote] = useState<string | null>(null);

  function set(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setStatus('loading');
    setReport(null);
    try {
      const res = await requestProductSubmit({
        sku,
        input: assembleInput(sku, values),
        context: context.trim() === '' ? undefined : context.trim(),
      });
      if (res.status === 200) {
        const body = res.body as {
          report: ProductReportView;
          persistence: { persisted: boolean; reason?: string };
        };
        setReport(body.report);
        setPersistNote(
          body.persistence.persisted
            ? 'Saved — a coach can now review it.'
            : 'Preview only — saving + coach review turn on once the database is live.',
        );
        setStatus('idle');
        return;
      }
      setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  if (report) {
    return (
      <div className="space-y-4">
        {persistNote ? (
          <p className="rounded bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
            {persistNote}
          </p>
        ) : null}
        <ProductReportViewCard report={report} />
        <button
          type="button"
          onClick={() => setReport(null)}
          className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELD_SETS[sku].map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="font-medium">{f.label}</span>
            {f.kind === 'select' ? (
              <select
                value={String(values[f.key])}
                onChange={(e) => set(f.key, e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-transparent px-2 py-1 dark:border-gray-700"
              >
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.kind === 'boolean' ? (
              <input
                type="checkbox"
                checked={values[f.key] === true}
                onChange={(e) => set(f.key, e.target.checked)}
                className="ml-2 align-middle"
              />
            ) : (
              <input
                type={f.kind === 'number' ? 'number' : 'text'}
                value={String(values[f.key])}
                min={f.min}
                max={f.max}
                onChange={(e) => set(f.key, e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-transparent px-2 py-1 dark:border-gray-700"
              />
            )}
          </label>
        ))}
      </div>

      <label className="block text-sm">
        <span className="font-medium">Anything else? (optional)</span>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded border border-gray-300 bg-transparent px-2 py-1 dark:border-gray-700"
        />
      </label>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {status === 'loading' ? 'Analyzing…' : 'Get my analysis'}
      </button>
      {status === 'error' ? (
        <p className="text-sm text-red-600">
          Something went wrong — check your inputs and try again.
        </p>
      ) : null}
    </form>
  );
}
