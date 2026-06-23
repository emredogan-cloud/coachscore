import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PricingTable } from '@/components/pricing/pricing-table';

describe('PricingTable', () => {
  it('renders tiers, the highlighted plan, prices, and the comparison', () => {
    const html = renderToStaticMarkup(<PricingTable />);
    expect(html).toContain('Standard');
    expect(html).toContain('$12');
    expect(html).toContain('Most popular');
    expect(html).toContain('Compare plans');
    expect(html).toContain('Human coach review');
    expect(html).toContain('Free with any account score');
  });
});
