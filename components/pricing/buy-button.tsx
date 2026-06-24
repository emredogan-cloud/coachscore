'use client';

import { useState } from 'react';
import { requestCheckout } from '@/app/report/actions';
import type { SkuId } from '@/lib/pricing';
import { MagicButton } from '@/components/ui';

type Status = 'idle' | 'loading' | 'not_activated' | 'error';

export function BuyButton({ sku, label }: { sku: SkuId; label: string }) {
  const [status, setStatus] = useState<Status>('idle');

  async function buy() {
    setStatus('loading');
    try {
      const res = await requestCheckout({ sku });
      if (res.status === 200) {
        const body = res.body as { url?: string };
        if (typeof body.url === 'string' && body.url.length > 0) {
          window.location.href = body.url;
          return;
        }
      }
      setStatus(res.status === 503 ? 'not_activated' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <MagicButton
        variant="violet"
        size="lg"
        onClick={() => void buy()}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Starting…' : label}
      </MagicButton>
      {status === 'not_activated' ? (
        <p className="mt-2 text-xs text-amber-300/90">
          Checkout isn’t activated yet (Stripe not configured).
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-2 text-xs text-red-300">
          Something went wrong — try again.
        </p>
      ) : null}
    </div>
  );
}
