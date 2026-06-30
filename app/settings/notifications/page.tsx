import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { NotificationSettings } from '@/components/reminders/notification-settings';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Reminder settings — CoachScore',
  description:
    'Turn on re-score reminders so CoachScore nudges you when an upgrade ' +
    'probably finished — and choose how often.',
  path: '/settings/notifications',
  noindex: true,
});

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Reminders', href: '/settings/notifications' },
        ]}
      />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-violet-gradient">
        Reminders
      </h1>
      <p className="mt-2 text-[15px] text-[var(--muted)]">
        The product is most useful when you come back as your account grows. Opt
        into reminders and we&apos;ll nudge you to re-score.
      </p>
      <div className="mt-8">
        <NotificationSettings />
      </div>
    </div>
  );
}
