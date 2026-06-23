/**
 * Transactional email templates (Phase 4). Pure builders returning a complete
 * `EmailMessage` (subject + escaped HTML + text). The mandatory Supercell
 * disclaimer is included; interpolated values are HTML-escaped.
 */

import { formatPrice, getTier, type SkuId } from '@/lib/pricing';
import type { EmailMessage } from './types';

const DISCLAIMER =
  'This material is unofficial and is not endorsed by Supercell. ' +
  'Clash of Clans is a trademark of Supercell.';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:sans-serif;color:#111">${bodyHtml}<hr/><p style="color:#777;font-size:11px">${esc(
    DISCLAIMER,
  )}</p></body></html>`;
}

export interface ReportReadyData {
  readonly toEmail: string;
  readonly grade: string;
  readonly overall: number;
  readonly townHall: number;
  readonly reportUrl: string;
}

export function reportReadyEmail(data: ReportReadyData): EmailMessage {
  const subject = `Your CoachScore report is ready — Grade ${data.grade}`;
  const text =
    `Your Town Hall ${data.townHall} CoachScore report is ready.\n` +
    `Grade ${data.grade} (${data.overall}/100).\n` +
    `View it: ${data.reportUrl}\n\n${DISCLAIMER}`;
  const html = wrap(
    `<h2>Your CoachScore report is ready</h2>` +
      `<p>Town Hall ${data.townHall} — <strong>Grade ${esc(data.grade)}</strong> (${
        data.overall
      }/100).</p>` +
      `<p><a href="${esc(data.reportUrl)}">View your full report</a></p>`,
  );
  return { to: data.toEmail, subject, html, text };
}

export interface ReceiptData {
  readonly toEmail: string;
  readonly sku: SkuId;
  readonly amountCents: number;
  readonly currency: string;
  readonly orderId: string;
}

export function receiptEmail(data: ReceiptData): EmailMessage {
  const tier = getTier(data.sku);
  const amount = `$${(data.amountCents / 100).toFixed(2)} ${data.currency.toUpperCase()}`;
  const subject = `Your CoachScore receipt — ${tier.name}`;
  const text =
    `Thanks for your purchase: ${tier.name} (${formatPrice(tier)}).\n` +
    `Amount: ${amount}\nOrder: ${data.orderId}\n\n${DISCLAIMER}`;
  const html = wrap(
    `<h2>Thanks for your purchase</h2>` +
      `<p>${esc(tier.name)} — <strong>${esc(amount)}</strong></p>` +
      `<p>Order: ${esc(data.orderId)}</p>`,
  );
  return { to: data.toEmail, subject, html, text };
}
