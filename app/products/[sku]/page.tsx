import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductSubmitForm } from '@/components/products/product-submit-form';
import { StatusBadge } from '@/components/ui';
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
  return { title: `${product.name} — CoachScore`, description: product.blurb };
}

export default async function ProductSkuPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  if (!isSku(sku)) notFound();
  const product = getProduct(sku);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-white"
      >
        ← All tools
      </Link>
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
