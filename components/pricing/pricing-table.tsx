import {
  COMPARISON,
  formatPrice,
  PRIMARY_PRICING,
  PRIMARY_SKU_IDS,
  SITUATIONAL_PRICING,
} from '@/lib/pricing';
import { PremiumCard } from '@/components/ui';
import { BuyButton } from './buy-button';

/**
 * Pricing layer (Phase 4 · simplified for conversion in Phase F). To cut
 * cognitive load the page leads with three PRIMARY tiers (Free → Standard★ →
 * Pro), tucks the situational tiers (Basic / AccountRescue / Clan-Bulk) into a
 * compact secondary list, and limits the comparison matrix to the primary
 * three. Real prices/tiers unchanged (set below the in-game impulse threshold —
 * see MONETIZATION_ANALYSIS.md).
 */
export function PricingTable() {
  return (
    <div className="space-y-10">
      {/* Primary tiers — the core three-way decision */}
      <div className="space-y-4">
        {PRIMARY_PRICING.map((tier) => (
          <PremiumCard
            key={tier.id}
            tone={tier.highlighted ? 'gold' : 'violet'}
            glowed={tier.highlighted}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {tier.highlighted ? (
                  <span className="mb-1 inline-block rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-gold-light ring-1 ring-brand-gold/30">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{tier.blurb}</p>
              </div>
              <p
                className={`shrink-0 text-2xl font-extrabold ${
                  tier.highlighted ? 'text-gold-gradient' : 'text-white'
                }`}
              >
                {formatPrice(tier)}
              </p>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--fg)]/90">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {tier.purchasable ? (
                <BuyButton sku={tier.id} label={`Choose ${tier.name}`} />
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Free with any account score
                </p>
              )}
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* Situational tiers — compact, secondary (lower cognitive load) */}
      {SITUATIONAL_PRICING.length > 0 ? (
        <div>
          <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80">
            Situational plans
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-center text-sm text-[var(--muted)]">
            For specific moments — most players want Standard.
          </p>
          <ul className="mt-4 space-y-2">
            {SITUATIONAL_PRICING.map((tier) => (
              <li key={tier.id}>
                <PremiumCard tone="plain" className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h4 className="font-semibold text-white">
                          {tier.name}
                        </h4>
                        <span className="text-sm font-bold text-gold-gradient">
                          {formatPrice(tier)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                        {tier.blurb}
                      </p>
                    </div>
                    {tier.purchasable ? (
                      <div className="shrink-0">
                        <BuyButton sku={tier.id} label="Choose" />
                      </div>
                    ) : null}
                  </div>
                </PremiumCard>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Comparison — limited to the primary three to stay scannable */}
      <div>
        <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80">
          Compare the main plans
        </h3>
        <PremiumCard tone="plain" className="mt-3 overflow-x-auto p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="py-1 font-medium">Feature</th>
                {PRIMARY_PRICING.map((t) => (
                  <th key={t.id} className="py-1 text-center font-medium">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-t border-white/5">
                  <td className="py-1.5 text-[var(--fg)]/90">{row.feature}</td>
                  {PRIMARY_SKU_IDS.map((id) => {
                    const cell = row.cells[id];
                    return (
                      <td key={id} className="py-1.5 text-center">
                        {cell === true ? (
                          <span className="text-brand-gold">✓</span>
                        ) : cell === false ? (
                          <span className="text-white/20">—</span>
                        ) : (
                          <span className="text-[var(--muted)]">{cell}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </PremiumCard>
      </div>
    </div>
  );
}
