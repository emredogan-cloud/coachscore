/**
 * Notification → email rendering (Phase 5). Pure: turns a stored notification
 * into a deliverable `EmailMessage` (HTML-escaped). The marketplace service
 * creates the notifications; delivery is handled by `dispatch` (gated on Resend).
 */

import type { Notification } from '@/lib/db';
import type { EmailMessage } from '@/lib/email';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function notificationToEmail(
  notification: Notification,
  toEmail: string,
): EmailMessage {
  const subject = `[CoachScore] ${notification.title}`;
  const text = `${notification.title}\n\n${notification.body}`;
  const title = esc(notification.title);
  const body = esc(notification.body);
  // Both interpolations are HTML-escaped above, so this is safe static markup.
  // nosemgrep: javascript.express.security.injection.raw-html-format.raw-html-format
  const html = `<!doctype html><html><body style="font-family:sans-serif;color:#111"><h3>${title}</h3><p>${body}</p><hr/><p style="color:#777;font-size:11px">CoachScore — unofficial, not endorsed by Supercell.</p></body></html>`;
  return { to: toEmail, subject, html, text };
}
