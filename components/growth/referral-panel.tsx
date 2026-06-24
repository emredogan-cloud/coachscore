'use client';

import { useEffect, useState } from 'react';
import {
  requestClaimReferral,
  requestMyReferrals,
  requestReferralCode,
} from '@/app/growth/actions';
import { buildReferralShare } from '@/lib/share';
import { ShareButtons } from './share-buttons';

interface Stats {
  readonly total: number;
  readonly qualified: number;
  readonly rewardCents: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'not_activated' }
  | { kind: 'ready'; code: string | null; stats: Stats };

export function ReferralPanel() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [claimCode, setClaimCode] = useState('');
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await requestMyReferrals();
    if (res.status === 200) {
      const body = res.body as { code: string | null; stats: Stats };
      setState({ kind: 'ready', code: body.code, stats: body.stats });
    } else {
      setState({ kind: 'not_activated' });
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createCode() {
    const res = await requestReferralCode();
    if (res.status === 200) await refresh();
    else setState({ kind: 'not_activated' });
  }

  async function claim() {
    const res = await requestClaimReferral({ code: claimCode.trim() });
    setClaimMsg(
      res.status === 200
        ? 'Referral applied — enjoy your discount at checkout.'
        : 'That code could not be applied.',
    );
  }

  if (state.kind === 'loading') {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  if (state.kind === 'not_activated') {
    return (
      <p className="rounded bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30">
        Referrals turn on once accounts are live. The program is built and
        ready.
      </p>
    );
  }

  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://coachscore.app';
  const share = state.code
    ? buildReferralShare({ appUrl, code: state.code })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Your referral code
        </h2>
        {state.code ? (
          <>
            <p className="mt-1 text-2xl font-bold">{state.code}</p>
            {share ? (
              <div className="mt-3">
                <ShareButtons targets={share.targets} />
              </div>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={() => void createCode()}
            className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Create my code
          </button>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Your impact
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {state.stats.total} referrals · {state.stats.qualified} converted · $
          {(state.stats.rewardCents / 100).toFixed(2)} earned
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Have a code?
        </h2>
        <div className="mt-2 flex gap-2">
          <input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            placeholder="CS2K7M9P"
            className="rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-700"
          />
          <button
            type="button"
            onClick={() => void claim()}
            className="rounded border border-gray-300 px-3 py-1 text-sm dark:border-gray-700"
          >
            Apply
          </button>
        </div>
        {claimMsg ? (
          <p className="mt-1 text-xs text-gray-500">{claimMsg}</p>
        ) : null}
      </div>
    </div>
  );
}
