import type { ReactNode } from 'react';

/**
 * Tiny, dependency-free, SAFE markdown renderer for Copilot answers (Phase 5).
 *
 * Builds React elements directly (never dangerouslySetInnerHTML), so model
 * output cannot inject HTML/scripts — React escapes all text. Supports the
 * subset the Copilot is prompted to use: headings, bold/italic, inline code,
 * fenced code blocks, ordered + unordered lists, blockquote callouts, tables,
 * and links (http/https/relative only). Pure + unit-tested.
 */

// Inline spans: code, bold, italic, and [text](url) links.
function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on code spans first so emphasis inside them is left literal.
  const segments = text.split(/(`[^`]+`)/g);
  segments.forEach((seg, si) => {
    if (/^`[^`]+`$/.test(seg)) {
      out.push(
        <code
          key={`${key}-c${si}`}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-brand-gold-light"
        >
          {seg.slice(1, -1)}
        </code>,
      );
      return;
    }
    out.push(...renderEmphasis(seg, `${key}-${si}`));
  });
  return out;
}

const TOKEN =
  /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;

function renderEmphasis(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-e${i++}`;
    if (m[1] !== undefined && m[2] !== undefined) {
      // [text](url) — only allow safe schemes.
      const href = m[2];
      const safe = /^(https?:\/\/|\/)/.test(href) ? href : '#';
      out.push(
        <a
          key={k}
          href={safe}
          className="text-brand-violet-light underline underline-offset-2 hover:text-white"
          {...(safe.startsWith('http')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {m[1]}
        </a>,
      );
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={k} className="font-bold text-white">
          {m[3]}
        </strong>,
      );
    } else {
      const italic = m[4] ?? m[5] ?? '';
      out.push(<em key={k}>{italic}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Table({ rows, k }: { rows: string[]; k: string }): ReactNode {
  const cells = (line: string) =>
    line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());
  const header = cells(rows[0] ?? '');
  const body = rows.slice(2).map(cells);
  return (
    <div key={k} className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.85em]">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th
                key={i}
                className="border-b border-white/15 px-2 py-1 font-semibold text-brand-gold"
              >
                {renderInline(h, `${k}-th${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className="border-b border-white/8 px-2 py-1 text-[var(--fg)]/90"
                >
                  {renderInline(c, `${k}-r${ri}c${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Markdown({ content }: { content: string }): ReactNode {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const k = `b${key++}`;

    // Fenced code block.
    if (line.trimStart().startsWith('```')) {
      const code: string[] = [];
      i += 1;
      while (
        i < lines.length &&
        !(lines[i] ?? '').trimStart().startsWith('```')
      ) {
        code.push(lines[i] ?? '');
        i += 1;
      }
      i += 1; // closing fence
      blocks.push(
        <pre
          key={k}
          className="my-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-[0.8em] leading-relaxed"
        >
          <code className="font-mono text-[var(--fg)]/90">
            {code.join('\n')}
          </code>
        </pre>,
      );
      continue;
    }

    // Table (header row + |---| separator).
    if (
      line.includes('|') &&
      /\|?\s*:?-{2,}/.test(lines[i + 1] ?? '') &&
      (lines[i + 1] ?? '').includes('|')
    ) {
      const rows: string[] = [];
      while (i < lines.length && (lines[i] ?? '').includes('|')) {
        rows.push(lines[i] ?? '');
        i += 1;
      }
      blocks.push(Table({ rows, k }));
      continue;
    }

    // Headings.
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = (h[1] ?? '#').length;
      const cls =
        level === 1
          ? 'mt-3 mb-1 text-base font-extrabold text-white'
          : level === 2
            ? 'mt-3 mb-1 text-sm font-bold text-white'
            : 'mt-2 mb-1 text-sm font-semibold text-brand-violet-light';
      blocks.push(
        <p key={k} className={cls}>
          {renderInline(h[2] ?? '', k)}
        </p>,
      );
      i += 1;
      continue;
    }

    // Blockquote / callout.
    if (line.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('>')) {
        quote.push((lines[i] ?? '').replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(
        <div
          key={k}
          className="my-2 rounded-lg border-l-2 border-brand-violet-light bg-brand-violet/10 px-3 py-2 text-[var(--fg)]/90"
        >
          {renderInline(quote.join(' '), k)}
        </div>,
      );
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={k} className="my-1.5 ml-5 list-decimal space-y-1">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `${k}-${ii}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Unordered list.
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={k} className="my-1.5 ml-5 list-disc space-y-1">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `${k}-${ii}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Blank line.
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Paragraph (gather consecutive non-blank, non-special lines).
    const para: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !/^\s*[-*]\s+/.test(lines[i] ?? '') &&
      !/^\s*\d+\.\s+/.test(lines[i] ?? '') &&
      !(lines[i] ?? '').startsWith('>') &&
      !(lines[i] ?? '').match(/^#{1,3}\s+/) &&
      !(lines[i] ?? '').trimStart().startsWith('```')
    ) {
      para.push(lines[i] ?? '');
      i += 1;
    }
    blocks.push(
      <p key={k} className="leading-relaxed">
        {renderInline(para.join(' '), k)}
      </p>,
    );
  }

  return <div className="space-y-1.5">{blocks}</div>;
}
