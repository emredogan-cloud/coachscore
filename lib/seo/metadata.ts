/**
 * Metadata framework (Phase 7). A single helper that produces Next `Metadata`
 * with canonical URL, Open Graph, and Twitter card from one small input — so
 * every page has consistent, SEO-correct head tags. Pure; the canonical base is
 * the configured app URL.
 */

import type { Metadata } from 'next';
import { appConfig } from '@/lib/env';

export function siteUrl(): string {
  return appConfig.url.replace(/\/$/, '');
}

export function canonicalUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl()}${p === '/' ? '' : p}`;
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
  const image = canonicalUrl(input.ogImagePath ?? '/api/share/og');
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
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
