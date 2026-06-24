import Link from 'next/link';
import { JsonLdScript } from './json-ld';
import { breadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

/**
 * Breadcrumb navigation + matching BreadcrumbList JSON-LD in one component, so
 * every public page gets both consistently (roadmap §9.8 — breadcrumbs on all
 * pages). The last item is the current page. URLs are made absolute for schema.
 */
export interface Crumb {
  readonly name: string;
  readonly href: string;
}

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd(
          items.map((i) => ({ name: i.name, url: canonicalUrl(i.href) })),
        )}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted)]">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1.5">
                {last ? (
                  <span className="text-[var(--fg)]/80" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-white">
                    {item.name}
                  </Link>
                )}
                {!last ? (
                  <span aria-hidden className="text-[var(--muted)]/40">
                    /
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
