'use client';

import { useEffect, useState } from 'react';
import {
  requestClaimReferral,
  requestMyReferrals,
  requestReferralCode,
} from '@/app/growth/actions';
import { buildReferralShare } from '@/lib/share';
import { EmptyState, MagicButton, PremiumCard } from '@/components/ui';
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
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  if (state.kind === 'not_activated') {
    return (
      <EmptyState
        icon="🎁"
        title="Referrals are built and ready"
        message="The creator-code program turns on the moment accounts go live. Your code, share targets, and rewards are all wired."
      />
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
    <div className="space-y-5">
      <PremiumCard tone="gold" glowed className="p-5 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
          Your referral code
        </h2>
        {state.code ? (
          <>
            <p className="mt-2 text-3xl font-extrabold tracking-widest text-gold-gradient">
              {state.code}
            </p>
            {share ? (
              <div className="mt-4">
                <ShareButtons targets={share.targets} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-3">
            <MagicButton variant="gold" onClick={() => void createCode()}>
              Create my code
            </MagicButton>
          </div>
        )}
      </PremiumCard>

      <PremiumCard tone="violet" className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-violet-light">
          Your impact
        </h2>
        <p className="mt-1.5 text-sm text-[var(--fg)]/90">
          {state.stats.total} referrals · {state.stats.qualified} converted · $
          {(state.stats.rewardCents / 100).toFixed(2)} earned
        </p>
      </PremiumCard>

      <PremiumCard tone="plain" className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Have a code?
        </h2>
        <div className="mt-2 flex gap-2">
          <input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            placeholder="CS2K7M9P"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-violet/60 focus:ring-2 focus:ring-brand-violet/25"
          />
          <MagicButton variant="ghost" onClick={() => void claim()}>
            Apply
          </MagicButton>
        </div>
        {claimMsg ? (
          <p className="mt-1.5 text-xs text-[var(--muted)]">{claimMsg}</p>
        ) : null}
      </PremiumCard>
    </div>
  );
}
