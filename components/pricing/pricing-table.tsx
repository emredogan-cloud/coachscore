import { COMPARISON, formatPrice, PRICING_LIST } from '@/lib/pricing';
import { BuyButton } from './buy-button';

/**
 * Pricing layer (Phase 4): tier cards from the SKU catalog + a comparison
 * matrix. Purchasable tiers get a checkout button; the free teaser does not.
 */
export function PricingTable() {
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_LIST.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-lg border p-5 ${
              tier.highlighted
                ? 'border-black dark:border-white'
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            {tier.highlighted ? (
              <p className="text-xs font-semibold uppercase tracking-wide">
                Most popular
              </p>
            ) : null}
            <h3 className="text-lg font-bold">{tier.name}</h3>
            <p className="mt-1 text-2xl font-bold">{formatPrice(tier)}</p>
            <p className="mt-1 text-sm text-gray-500">{tier.blurb}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {tier.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <div className="mt-4">
              {tier.purchasable ? (
                <BuyButton sku={tier.id} label={`Choose ${tier.name}`} />
              ) : (
                <span className="text-sm text-gray-500">
                  Free with any account score
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Compare plans
        </h3>
        <table className="mt-2 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr>
              <th className="py-1">Feature</th>
              {PRICING_LIST.map((t) => (
                <th key={t.id} className="py-1 text-center">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr
                key={row.feature}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="py-1">{row.feature}</td>
                {PRICING_LIST.map((t) => {
                  const cell = row.cells[t.id];
                  return (
                    <td key={t.id} className="py-1 text-center">
                      {cell === true ? '✓' : cell === false ? '—' : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
