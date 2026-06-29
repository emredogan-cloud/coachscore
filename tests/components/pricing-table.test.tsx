import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PricingTable } from '@/components/pricing/pricing-table';

describe('PricingTable', () => {
  it('shows the simplified public three (Free → Premium Report★ → Account Rescue)', () => {
    const html = renderToStaticMarkup(<PricingTable />);
    // The honest public product: Free, Premium Report ($7), Account Rescue ($19).
    expect(html).toContain('Free Teaser');
    expect(html).toContain('Premium Report');
    expect(html).toContain('Account Rescue');
    expect(html).toContain('$7');
    expect(html).toContain('$19');
    expect(html).toContain('Most popular');
    expect(html).toContain('Free with any account score');
    expect(html).toContain('Compare the main plans');
    expect(html).toContain('De-rush plan');
  });

  it('hides the human-reviewed + clan tiers and their claims by default', () => {
    // human_review_enabled / clan_plans_enabled default OFF — no Standard/Pro,
    // no Clan/Bulk, no "human coach review" claim, no situational section.
    const html = renderToStaticMarkup(<PricingTable />);
    expect(html).not.toContain('Situational plans');
    expect(html).not.toContain('Human coach review');
    expect(html).not.toContain('Clan / Bulk');
    expect(html).not.toContain('per roster');
  });
});
