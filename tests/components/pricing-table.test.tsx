import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PricingTable } from '@/components/pricing/pricing-table';

describe('PricingTable', () => {
  it('leads with the primary tiers, the highlighted plan, prices, and the comparison', () => {
    const html = renderToStaticMarkup(<PricingTable />);
    // Primary three lead the page (Free → Standard★ → Pro).
    expect(html).toContain('Free Teaser');
    expect(html).toContain('Standard');
    expect(html).toContain('Pro');
    expect(html).toContain('$12');
    expect(html).toContain('Most popular');
    expect(html).toContain('Free with any account score');
    // Situational tiers are tucked into a secondary section (lower load).
    expect(html).toContain('Situational plans');
    expect(html).toContain('AccountRescue');
    // Comparison limited to the primary plans.
    expect(html).toContain('Compare the main plans');
    expect(html).toContain('Human coach review');
  });
});
