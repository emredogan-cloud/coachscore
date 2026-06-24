import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CoachDashboard } from '@/components/coach/coach-dashboard';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

describe('CoachDashboard', () => {
  it('renders the coach summary, review queues, and earnings', () => {
    const html = renderToStaticMarkup(
      <CoachDashboard
        data={{
          coach: {
            displayName: 'WarCoach',
            status: 'active',
            reputationScore: 88,
            ratingCount: 12,
          },
          pendingReviews: [{ id: 'ra1', reportId: 'rep-1', status: 'claimed' }],
          completedReviews: [],
          earnings: { coachCents: 1440, payoutCount: 2 },
          activated: true,
        }}
      />,
    );
    expect(html).toContain('WarCoach');
    expect(html).toContain('reputation 88/100');
    expect(html).toContain('Pending reviews');
    expect(html).toContain('$14.40');
  });

  it('shows the not-activated banner when the DB is off', () => {
    const html = renderToStaticMarkup(
      <CoachDashboard
        data={{
          coach: null,
          pendingReviews: [],
          completedReviews: [],
          earnings: { coachCents: 0, payoutCount: 0 },
          activated: false,
        }}
      />,
    );
    expect(html).toContain('not activated');
  });
});

describe('AdminDashboard', () => {
  it('renders the approval, moderation, and dispute queues', () => {
    const html = renderToStaticMarkup(
      <AdminDashboard
        data={{
          applications: [
            { id: 'a1', displayName: 'NewCoach', status: 'pending' },
          ],
          moderationQueue: [{ id: 'm1', status: 'pending' }],
          disputes: [{ id: 'd1', reason: 'Wrong levels', status: 'open' }],
          activated: true,
        }}
      />,
    );
    expect(html).toContain('Coach approval queue');
    expect(html).toContain('NewCoach');
    expect(html).toContain('Moderation queue');
    expect(html).toContain('Open disputes');
    expect(html).toContain('Wrong levels');
  });
});
