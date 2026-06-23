'use client';

import { useState } from 'react';
import { requestCheckout } from '@/app/report/actions';
import type { SkuId } from '@/lib/pricing';

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
      <button
        type="button"
        onClick={() => void buy()}
        disabled={status === 'loading'}
        className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {status === 'loading' ? 'Starting…' : label}
      </button>
      {status === 'not_activated' ? (
        <p className="mt-1 text-xs text-amber-600">
          Checkout isn’t activated yet (Stripe not configured).
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-1 text-xs text-red-600">
          Something went wrong — try again.
        </p>
      ) : null}
    </div>
  );
}
