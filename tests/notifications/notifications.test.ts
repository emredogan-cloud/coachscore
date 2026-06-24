import { describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import type { EmailProvider } from '@/lib/email';
import { dispatchNotification, notificationToEmail } from '@/lib/notifications';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

async function makeNotification(
  title = 'New review',
  body = 'A report awaits.',
) {
  const repos = createInMemoryRepositories(deps());
  const notification = await repos.notifications.create({
    userId: 'u1',
    kind: 'assignment',
    title,
    body,
  });
  return { repos, notification };
}

describe('notificationToEmail', () => {
  it('renders subject/body and escapes HTML', async () => {
    const { notification } = await makeNotification('Review <b>ready</b>');
    const msg = notificationToEmail(notification, 'a@b.co');
    expect(msg.to).toBe('a@b.co');
    expect(msg.subject).toBe('[CoachScore] Review <b>ready</b>');
    expect(msg.html).toContain('&lt;b&gt;ready&lt;/b&gt;');
    expect(msg.html).not.toContain('<b>ready</b>');
  });
});

describe('dispatchNotification', () => {
  it('marks sent on success', async () => {
    const { repos, notification } = await makeNotification();
    const provider: EmailProvider = {
      async send() {
        return { id: 'em_1' };
      },
    };
    const result = await dispatchNotification(notification, 'a@b.co', {
      provider,
      repos,
    });
    expect(result.status).toBe('sent');
    expect((await repos.notifications.listByUser('u1'))[0]?.status).toBe(
      'sent',
    );
  });

  it('marks failed when the provider throws (delivery gated/unavailable)', async () => {
    const { repos, notification } = await makeNotification();
    const provider: EmailProvider = {
      async send() {
        throw new Error('not activated');
      },
    };
    const result = await dispatchNotification(notification, 'a@b.co', {
      provider,
      repos,
    });
    expect(result.status).toBe('failed');
    expect((await repos.notifications.listByUser('u1'))[0]?.status).toBe(
      'failed',
    );
  });
});
