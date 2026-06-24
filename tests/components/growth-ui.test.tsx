import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildGrowthDashboard } from '@/lib/growth';
import { buildShareTargets } from '@/lib/share';
import { GrowthDashboardView } from '@/components/growth/growth-dashboard';
import { ShareButtons } from '@/components/growth/share-buttons';

describe('GrowthDashboardView', () => {
  it('renders KPI cards, funnels, and the referral summary', () => {
    const dashboard = buildGrowthDashboard({
      events: [],
      assignments: [],
      referrals: [],
    });
    const html = renderToStaticMarkup(
      <GrowthDashboardView dashboard={dashboard} />,
    );
    expect(html).toContain('Teaser → paid');
    expect(html).toContain('K-factor');
    expect(html).toContain('Acquisition → paid');
    expect(html).toContain('Funnels');
  });
});

describe('ShareButtons', () => {
  it('renders a link per share target', () => {
    const targets = buildShareTargets({
      url: 'https://coachscore.app/r/CSAB23CD',
      text: 'Rate your account',
    });
    const html = renderToStaticMarkup(<ShareButtons targets={targets} />);
    expect(html).toContain('Share on X');
    expect(html).toContain('Copy link');
    expect(html).toContain('twitter.com/intent/tweet');
  });
});
