import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductSubmitForm } from '@/components/products/product-submit-form';
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
  return {
    title: `${product.name} — CoachScore`,
    description: product.blurb,
  };
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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{product.blurb}</p>
      <p className="mt-1 text-sm text-gray-500">
        {formatProductPrice(product)}
        {product.repeatable ? ' per replay' : ''} · coach-verified
      </p>
      <div className="mt-8">
        <ProductSubmitForm sku={sku} />
      </div>
    </div>
  );
}
