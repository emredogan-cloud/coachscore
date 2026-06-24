import Link from 'next/link';
import { formatProductPrice, PRODUCT_LIST } from '@/lib/products';

/**
 * Specialized-tool cards (Phase 6): ReplayDoctor / BaseDoctor / WarPlan from the
 * product catalog. Each links to its submission flow. Presentational + hook-free,
 * so it renders on the server and is reused on the products hub and the pricing
 * page.
 */
export function ProductCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PRODUCT_LIST.map((product) => (
        <div
          key={product.sku}
          className="flex flex-col rounded-lg border border-gray-200 p-5 dark:border-gray-800"
        >
          <h3 className="text-lg font-bold">{product.name}</h3>
          <p className="mt-1 text-2xl font-bold">
            {formatProductPrice(product)}
            {product.repeatable ? (
              <span className="ml-2 text-xs font-normal text-gray-500">
                per replay
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-gray-500">{product.blurb}</p>
          <ul className="mt-3 flex-1 space-y-1 text-sm">
            {product.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <div className="mt-4">
            <Link
              href={`/products/${product.sku}`}
              className="inline-block w-full rounded bg-black px-4 py-2 text-center text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Start {product.name}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
