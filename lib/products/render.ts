/**
 * Product report HTML rendering (Phase 6). Deterministic, HTML-escaped print/web
 * layout shared by all three SKUs.
 */

import type { ProductReportView } from './types';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function list(items: readonly string[]): string {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

export function renderProductReportHtml(report: ProductReportView): string {
  const sections = report.sections
    .map(
      (s) =>
        `<h2>${esc(s.title)}</h2>${
          s.items.length === 0 ? '<p>—</p>' : list(s.items)
        }`,
    )
    .join('');
  const score =
    report.score === null
      ? ''
      : `<p class="score"><strong>${esc(report.score.label)}:</strong> ${
          report.score.value
        }/100</p>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>${esc(report.title)} report</title>
<style>body{font:13px/1.5 sans-serif;color:#111}h1{font-size:24px}h2{font-size:15px;border-bottom:1px solid #ddd;margin-top:16px}.score{font-size:16px}footer{color:#777;font-size:10px;margin-top:20px}</style>
</head><body>
<h1>${esc(report.title)}</h1>
<p>${esc(report.summary)}</p>
${score}
${sections}
<h2>Recommendations</h2>${list(report.recommendations)}
<footer>Version: ${esc(report.version)} · Confidence: ${Math.round(
    report.confidence * 100,
  )}%${report.aiAuthored ? ' · AI-drafted' : ''}<br/>This material is unofficial and is not endorsed by Supercell. Clash of Clans is a trademark of Supercell.</footer>
</body></html>`;
}
