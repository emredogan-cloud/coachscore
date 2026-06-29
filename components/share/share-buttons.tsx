'use client';

import { useState } from 'react';
import { track } from '@/components/analytics/track';

/**
 * Share experience (immersion sprint · Section 3). One-tap sharing via the
 * Web Share API (`navigator.share`) where supported, with explicit fallbacks:
 * WhatsApp + X intent links, copy-to-clipboard (also the path for Discord,
 * which has no web share-intent), and an optional "download card" (the OG
 * image). No Supercell art — premium styling only. Hook-based client island.
 */
export function ShareButtons({
  url,
  text,
  imageUrl,
}: {
  url: string;
  text: string;
  imageUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const full = `${text} ${url}`;

  async function nativeShare(): Promise<void> {
    track('share_clicked', { target: 'native' });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'CoachScore', text, url });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      await copyLink();
    }
  }

  async function copyLink(): Promise<void> {
    track('share_clicked', { target: 'copy' });
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const pill =
    'inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[var(--fg)]/90 transition hover:border-brand-violet/40 hover:text-white';

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-gradient px-5 py-3 font-semibold text-white shadow-glow-violet-sm transition hover:shadow-glow-violet"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Share my result
      </button>
      <div className="flex flex-wrap gap-2">
        <a
          className={pill}
          href={`https://wa.me/?text=${enc(full)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('share_clicked', { target: 'whatsapp' })}
        >
          WhatsApp
        </a>
        <a
          className={pill}
          href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('share_clicked', { target: 'x' })}
        >
          X
        </a>
        <button
          type="button"
          className={pill}
          onClick={copyLink}
          aria-label="Copy link to share on Discord"
        >
          {copied ? 'Copied ✓' : 'Discord'}
        </button>
        <button type="button" className={pill} onClick={copyLink}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
        {imageUrl ? (
          <a className={pill} href={imageUrl} download="coachscore-card.png">
            Download card
          </a>
        ) : null}
      </div>
      <p className="text-xs text-[var(--muted)]">
        Tip: “Copy link” also works for Discord and clan chats.
      </p>
    </div>
  );
}
