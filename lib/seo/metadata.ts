/**
 * Metadata framework (Phase 7). A single helper that produces Next `Metadata`
 * with canonical URL, Open Graph, and Twitter card from one small input — so
 * every page has consistent, SEO-correct head tags. Pure; the canonical base is
 * the configured app URL.
 */

import type { Metadata } from 'next';
import { appConfig, optionalEnv } from '@/lib/env';

export function siteUrl(): string {
  return appConfig.url.replace(/\/$/, '');
}

export function canonicalUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl()}${p === '/' ? '' : p}`;
}

/** Absolute logo URL for Organization JSON-LD (the maskable PWA icon). */
export function orgLogoUrl(): string {
  return canonicalUrl('/icon.svg');
}

/**
 * Real, verified social/profile URLs for Organization `sameAs`, supplied via
 * `NEXT_PUBLIC_SOCIAL_PROFILES` (comma-separated). Empty by default — we never
 * fabricate profiles that do not exist (roadmap §11/KURALLAR).
 */
export function socialProfiles(): string[] {
  return optionalEnv('NEXT_PUBLIC_SOCIAL_PROFILES', '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http'));
}

export interface MetaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly ogImagePath?: string;
  readonly type?: 'website' | 'article';
  readonly noindex?: boolean;
}

export function buildMetadata(input: MetaInput): Metadata {
  const url = canonicalUrl(input.path);
  // Default to the branded static OG card (Phase 1). Pages that want a
  // score-specific card (report sharing) pass ogImagePath → /api/share/og?…
  const image = canonicalUrl(input.ogImagePath ?? '/og-image.png');
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
      // hreflang readiness (roadmap §9.10): English-first today, with an
      // x-default so adding locales later is a config change, not a refactor.
      languages: { en: url, 'x-default': url },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: 'CoachScore',
      type: input.type ?? 'website',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image],
    },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
