import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown } from '@/components/copilot/markdown';

const html = (s: string) => renderToStaticMarkup(<Markdown content={s} />);

describe('Copilot Markdown renderer', () => {
  it('renders bold, italic, and inline code', () => {
    const h = html('Use **heroes** and *lab* and `tag`.');
    expect(h).toContain('<strong');
    expect(h).toContain('heroes');
    expect(h).toContain('<em>lab</em>');
    expect(h).toContain('<code');
    expect(h).toContain('tag');
  });

  it('renders headings', () => {
    expect(html('# Title')).toContain('Title');
    expect(html('### Small')).toContain('Small');
  });

  it('renders ordered and unordered lists', () => {
    const ol = html('1. first\n2. second');
    expect(ol).toContain('<ol');
    expect(ol).toContain('first');
    expect(ol).toContain('second');
    const ul = html('- a\n- b');
    expect(ul).toContain('<ul');
    expect(ul).toContain('<li>a</li>');
  });

  it('renders a blockquote callout', () => {
    expect(html('> heads up')).toContain('heads up');
  });

  it('renders a code block without treating contents as markdown', () => {
    const h = html('```\n**not bold**\n```');
    expect(h).toContain('<pre');
    expect(h).toContain('**not bold**');
    expect(h).not.toContain('<strong>not bold');
  });

  it('renders a table', () => {
    const h = html('| TH | BK |\n| --- | --- |\n| 16 | 95 |');
    expect(h).toContain('<table');
    expect(h).toContain('<th');
    expect(h).toContain('95');
  });

  it('renders safe links and blocks unsafe schemes', () => {
    const safe = html('[guide](https://coachscore.app/guides)');
    expect(safe).toContain('href="https://coachscore.app/guides"');
    expect(safe).toContain('rel="noopener noreferrer"');
    const unsafe = html('[x](javascript:alert(1))');
    expect(unsafe).not.toContain('javascript:');
    expect(unsafe).toContain('href="#"');
  });

  it('never emits raw HTML/script from model text (XSS-safe)', () => {
    const h = html('<script>alert(1)</script> and <img src=x onerror=y>');
    expect(h).not.toContain('<script>');
    expect(h).not.toContain('onerror=y>');
    expect(h).toContain('&lt;script&gt;');
  });

  it('separates paragraphs on blank lines', () => {
    const h = html('para one\n\npara two');
    expect((h.match(/<p/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
