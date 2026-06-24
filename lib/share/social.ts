/**
 * Social share flows (Phase 7). Pure builders for share-intent URLs across the
 * networks Clash players use, plus UTM/ref attribution tagging so every inbound
 * click is attributable (the K-factor inputs). No I/O.
 */

export type ShareNetwork =
  | 'x'
  | 'whatsapp'
  | 'reddit'
  | 'telegram'
  | 'facebook'
  | 'copy';

export interface ShareTarget {
  readonly network: ShareNetwork;
  readonly label: string;
  readonly href: string;
}

export interface ShareIntent {
  readonly url: string;
  readonly text: string;
}

const enc = encodeURIComponent;

export function buildShareTargets(intent: ShareIntent): readonly ShareTarget[] {
  const { url, text } = intent;
  return [
    {
      network: 'x',
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    },
    {
      network: 'whatsapp',
      label: 'Share on WhatsApp',
      href: `https://wa.me/?text=${enc(`${text} ${url}`)}`,
    },
    {
      network: 'reddit',
      label: 'Share on Reddit',
      href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
    },
    {
      network: 'telegram',
      label: 'Share on Telegram',
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    },
    {
      network: 'facebook',
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    { network: 'copy', label: 'Copy link', href: url },
  ];
}

export interface ShareAttribution {
  readonly source: string;
  readonly medium?: string;
  readonly campaign?: string;
  readonly ref?: string;
}

/** Append UTM + ref attribution params to a URL (idempotent on the keys it sets). */
export function withShareAttribution(
  url: string,
  attr: ShareAttribution,
): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', attr.source);
  u.searchParams.set('utm_medium', attr.medium ?? 'share');
  if (attr.campaign) u.searchParams.set('utm_campaign', attr.campaign);
  if (attr.ref) u.searchParams.set('ref', attr.ref);
  return u.toString();
}

/** Read attribution back off an inbound URL (for the share-attribution event). */
export function parseShareAttribution(url: string): ShareAttribution | null {
  try {
    const u = new URL(url);
    const source = u.searchParams.get('utm_source');
    const ref = u.searchParams.get('ref') ?? undefined;
    if (!source && !ref) return null;
    return {
      source: source ?? 'referral',
      medium: u.searchParams.get('utm_medium') ?? undefined,
      campaign: u.searchParams.get('utm_campaign') ?? undefined,
      ref,
    };
  } catch {
    return null;
  }
}
