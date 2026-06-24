'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker (Phase 9). Render once in the root layout; it
 * registers `/sw.js` after load for offline support + installability. No-ops
 * where service workers are unsupported.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    const register = () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failures are non-fatal — the app works without the SW.
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
