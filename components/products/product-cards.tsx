import { formatProductPrice, PRODUCT_LIST } from '@/lib/products';
import { MagicButton, PremiumCard } from '@/components/ui';

/**
 * Specialized-tool "shield" cards (Phase 6 · premium restyle Phase B):
 * ReplayDoctor / BaseDoctor / WarPlan. Each links to its submission flow.
 * Server-rendered; reused on the products hub + the pricing page.
 */
const ICON: Record<string, string> = {
  replay_doctor: 'M8 5v14l11-7z',
  base_doctor: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  war_plan: 'M3 21l6-6m12-12l-6 6M9 9l6 6M14 4h6v6',
};

export function ProductCards() {
  return (
    <div className="grid gap-4">
      {PRODUCT_LIST.map((product) => (
        <PremiumCard key={product.sku} tone="violet" className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-gradient/20 text-brand-violet-light ring-1 ring-brand-violet/30">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill={product.sku === 'replay_doctor' ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={ICON[product.sku] ?? ICON.war_plan!} />
              </svg>
            </span>
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-white">{product.name}</h3>
                <span className="text-base font-extrabold text-gold-gradient">
                  {formatProductPrice(product)}
                  {product.repeatable ? (
                    <span className="ml-1 text-[10px] font-normal text-[var(--muted)]">
                      / replay
                    </span>
                  ) : null}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {product.blurb}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-[var(--fg)]/90">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet-light" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <MagicButton
              href={`/products/${product.sku}`}
              variant="violet"
              size="lg"
            >
              Start {product.name}
            </MagicButton>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}
