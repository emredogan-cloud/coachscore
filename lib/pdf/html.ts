/**
 * Print-ready HTML report (Phase 4). Deterministic, self-contained (inline
 * print CSS), and HTML-escaped — suitable for browser print-to-PDF and as the
 * canonical printable layout. No clock, no randomness.
 */

import type { RenderableReport } from '@/lib/report';

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

export function renderReportHtml(report: RenderableReport): string {
  const subScores = report.subScores
    .map(
      (s) =>
        `<tr><td>${esc(s.label)}</td><td>${
          s.value === null ? 'N/A' : Math.round(s.value)
        }</td></tr>`,
    )
    .join('');

  const roadmap =
    report.roadmap.length === 0
      ? '<p>Account is maxed for this Town Hall under this goal.</p>'
      : `<ol>${report.roadmap
          .map(
            (step) =>
              `<li><strong>${esc(step.elementId)}</strong>: ${step.fromLevel} → ${
                step.toLevel
              } <em>[${esc(step.estimatedImpact)}]</em><br/>${esc(
                step.rationale,
              )}</li>`,
          )
          .join('')}</ol>`;

  const strengths =
    report.strengths.length === 0
      ? '<p>None standing out yet.</p>'
      : list(report.strengths.map((s) => `${s.label}: ${s.value}`));
  const weaknesses =
    report.weaknesses.length === 0
      ? '<p>No dominant weakness.</p>'
      : list(report.weaknesses.map((w) => `${w.label}: ${w.value}`));

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>CoachScore Report — TH${report.townHall} ${esc(report.grade)}</title>
<style>
  @page { margin: 18mm; }
  body { font: 13px/1.5 -apple-system, Segoe UI, Roboto, sans-serif; color: #111; }
  h1 { font-size: 26px; margin: 0; }
  h2 { font-size: 15px; margin: 18px 0 6px; border-bottom: 1px solid #ddd; }
  .meta { color: #555; margin-top: 4px; }
  .grade { font-size: 40px; font-weight: 700; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 2px 6px; border-bottom: 1px solid #eee; }
  footer { margin-top: 24px; color: #777; font-size: 10px; }
</style></head>
<body>
  <h1>CoachScore Report</h1>
  <p class="meta">Town Hall ${report.townHall} · goal: ${esc(report.goal)} · ${esc(
    report.rushLabel,
  )}</p>
  <p class="grade">${esc(report.grade)} <span style="font-size:18px;font-weight:400;color:#555">${
    report.overall
  }/100</span></p>

  <h2>Diagnosis</h2><p>${esc(report.diagnosis)}</p>
  <h2>Strengths</h2>${strengths}
  <h2>Weaknesses</h2>${weaknesses}
  <h2>Sub-scores</h2><table>${subScores}</table>
  <h2>Upgrade roadmap</h2>${roadmap}
  <h2>Recommendations</h2>${list(report.recommendations)}

  <footer>
    <p>Version: ${esc(report.version.composite)} · Reference verified for paid use: ${
      report.referenceReady ? 'yes' : 'no'
    } · Confidence: ${Math.round(report.confidence * 100)}%</p>
    <p>This material is unofficial and is not endorsed by Supercell. Clash of Clans is a trademark of Supercell.</p>
  </footer>
</body></html>`;
}
