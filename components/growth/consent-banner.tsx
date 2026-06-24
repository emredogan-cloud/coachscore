'use client';

import { useEffect, useState } from 'react';

/**
 * Analytics consent banner (Phase 7) — GDPR/KVKK. Defaults to no tracking until
 * the visitor chooses; the choice is stored locally. Analytics capture honors
 * this (the app reads `cs_consent` before initializing client-side PostHog).
 */
const KEY = 'cs_consent';

export function ConsentBanner() {
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    try {
      setDecided(window.localStorage.getItem(KEY) !== null);
    } catch {
      setDecided(true);
    }
  }, []);

  function choose(value: 'granted' | 'denied') {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      // ignore storage failures — default stays "no tracking".
    }
    setDecided(true);
  }

  if (decided) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-gray-600 dark:text-gray-300">
          We use privacy-friendly analytics to improve CoachScore. No personal
          data is sold. Allow product analytics?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-700"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="rounded bg-black px-3 py-1.5 font-medium text-white dark:bg-white dark:text-black"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
