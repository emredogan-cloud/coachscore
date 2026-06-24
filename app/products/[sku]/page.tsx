import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductSubmitForm } from '@/components/products/product-submit-form';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import { StatusBadge } from '@/components/ui';
import { buildMetadata, canonicalUrl, productJsonLd } from '@/lib/seo';
import {
  formatProductPrice,
  getProduct,
  PRODUCT_SKUS,
  type ProductSku,
} from '@/lib/products';

export const dynamicParams = false;

export function generateStaticParams(): { sku: ProductSku }[] {
  return PRODUCT_SKUS.map((sku) => ({ sku }));
}

function isSku(value: string): value is ProductSku {
  return (PRODUCT_SKUS as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  if (!isSku(sku)) return { title: 'Not found — CoachScore' };
  const product = getProduct(sku);
  return buildMetadata({
    title: `${product.name} — Clash of Clans ${product.repeatable ? 'replay' : 'account'} review | CoachScore`,
    description: product.blurb,
    path: `/products/${sku}`,
  });
}

export default async function ProductSkuPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  if (!isSku(sku)) notFound();
  const product = getProduct(sku);
  const url = canonicalUrl(`/products/${sku}`);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <JsonLdScript
        data={productJsonLd({
          name: product.name,
          description: product.blurb,
          url,
          priceUsd: product.priceUsdCents / 100,
        })}
      />
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Tools', href: '/products' },
          { name: product.name, href: `/products/${sku}` },
        ]}
      />
      <header className="mt-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-violet-gradient">
            {product.name}
          </h1>
          <StatusBadge tone="gold">coach-verified</StatusBadge>
        </div>
        <p className="mt-2 text-[15px] text-[var(--muted)]">{product.blurb}</p>
        <p className="mt-1 text-sm font-semibold text-gold-gradient">
          {formatProductPrice(product)}
          {product.repeatable ? ' per replay' : ''}
        </p>
      </header>
      <div className="mt-7">
        <ProductSubmitForm sku={sku} />
      </div>
    </div>
  );
}
