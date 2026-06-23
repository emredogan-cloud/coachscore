/**
 * Deterministic report PDF (Phase 4) via pdf-lib — no external service, no
 * credential. Metadata dates are fixed and text is reduced to a WinAnsi-safe
 * subset, so the same report always produces byte-identical output (version
 * locking). The PDF embeds the report's composite version + the mandatory
 * Supercell disclaimer.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import type { RenderableReport } from '@/lib/report';

const FIXED_DATE = new Date(Date.UTC(2026, 0, 1));
const PAGE = { width: 595.28, height: 841.89, margin: 50 };
const LINE_HEIGHT = 14;

/** Reduce arbitrary text (incl. AI-authored) to ASCII so pdf-lib can encode it. */
function winAnsi(text: string): string {
  const replaced = text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[→⇒]/g, '->')
    .replace(/[•·]/g, '-')
    .replace(/…/g, '...');
  // Keep tab/newline/CR + printable ASCII; drop everything else (no
  // control-char regex). Guarantees pdf-lib's WinAnsi font can encode it.
  let out = '';
  for (const ch of replaced) {
    const code = ch.codePointAt(0) ?? 0;
    if (
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 126)
    ) {
      out += ch;
    }
  }
  return out;
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = winAnsi(text)
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const trial = current === '' ? word : `${current} ${word}`;
    if (current !== '' && font.widthOfTextAtSize(trial, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current !== '') lines.push(current);
  return lines.length > 0 ? lines : [''];
}

export async function renderReportPdf(
  report: RenderableReport,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`CoachScore Report - TH${report.townHall} ${report.grade}`);
  doc.setAuthor('CoachScore');
  doc.setCreator('CoachScore');
  doc.setProducer('CoachScore');
  doc.setSubject(report.version.composite);
  doc.setCreationDate(FIXED_DATE);
  doc.setModificationDate(FIXED_DATE);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE.width - PAGE.margin * 2;

  let page: PDFPage = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  const newPageIfNeeded = (need: number): void => {
    if (y - need < PAGE.margin) {
      page = doc.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
    }
  };

  const write = (
    text: string,
    opts: { size?: number; bold?: boolean } = {},
  ): void => {
    const size = opts.size ?? 11;
    const f = opts.bold === true ? bold : font;
    for (const line of wrap(text, f, size, maxWidth)) {
      newPageIfNeeded(LINE_HEIGHT);
      page.drawText(line, {
        x: PAGE.margin,
        y,
        size,
        font: f,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= LINE_HEIGHT;
    }
  };

  const heading = (text: string): void => {
    y -= 6;
    write(text, { size: 13, bold: true });
    y -= 2;
  };
  const space = (h = 8): void => {
    y -= h;
  };

  write('CoachScore Report', { size: 20, bold: true });
  write(
    `Town Hall ${report.townHall} | Grade ${report.grade} | ${report.overall}/100 | ` +
      `${report.rushLabel} | goal: ${report.goal}`,
  );
  space();

  heading('Diagnosis');
  write(report.diagnosis);
  space();

  heading('Strengths');
  if (report.strengths.length === 0) write('- None standing out yet.');
  for (const s of report.strengths) write(`- ${s.label}: ${s.value}`);
  space();

  heading('Weaknesses');
  if (report.weaknesses.length === 0) write('- No dominant weakness.');
  for (const w of report.weaknesses) write(`- ${w.label}: ${w.value}`);
  space();

  heading('Upgrade roadmap');
  if (report.roadmap.length === 0) {
    write('Account is maxed for this Town Hall under this goal.');
  }
  for (const step of report.roadmap) {
    write(
      `${step.rank}. ${step.elementId}: ${step.fromLevel} -> ${step.toLevel} ` +
        `[${step.estimatedImpact}] - ${step.rationale}`,
    );
  }
  space();

  heading('Recommendations');
  for (const r of report.recommendations) write(`- ${r}`);
  space(16);

  write(`Version: ${report.version.composite}`, { size: 8 });
  write(
    `Reference data verified for paid use: ${report.referenceReady ? 'yes' : 'no'}`,
    { size: 8 },
  );
  write(
    'This material is unofficial and is not endorsed by Supercell. ' +
      'Clash of Clans is a trademark of Supercell.',
    { size: 8 },
  );

  return doc.save({ useObjectStreams: false });
}
