import { describe, expect, it } from 'vitest';
import {
  analyzeProduct,
  assembleProductReport,
  formatProductPrice,
  getProduct,
  parseProductInput,
  PRODUCT_LIST,
  renderProductReportHtml,
  type ProductInput,
} from '@/lib/products';

const validReplay = {
  townHall: 14,
  context: 'war',
  starsEarned: 2,
  destructionPct: 80,
  durationSec: 180,
  timeRemainingSec: 30,
};
const validWar = {
  attackerTownHall: 13,
  defenderTownHall: 14,
  defenderBaseType: 'compartment',
  objective: 'three_star',
  roster: { army: 'hybrid', armyStrength: 'high' },
};

describe('catalog', () => {
  it('lists the three SKUs and formats prices', () => {
    expect(PRODUCT_LIST).toHaveLength(3);
    expect(getProduct('replay_doctor').repeatable).toBe(true);
    expect(getProduct('base_doctor').fulfillment).toBe('human_reviewed');
    expect(formatProductPrice(getProduct('replay_doctor'))).toBe('$9');
  });
});

describe('parseProductInput', () => {
  it('validates per SKU and rejects bad input', () => {
    const ok = parseProductInput('replay_doctor', validReplay);
    expect(ok.ok).toBe(true);
    expect(parseProductInput('replay_doctor', {}).ok).toBe(false);
    expect(parseProductInput('war_plan', validWar).ok).toBe(true);
    expect(parseProductInput('base_doctor', { townHall: 14 }).ok).toBe(false);
  });
});

describe('analyzeProduct + assembleProductReport + render', () => {
  it('dispatches, assembles, and renders a uniform report', () => {
    const parsed = parseProductInput('replay_doctor', validReplay);
    if (!parsed.ok) throw new Error('expected valid input');
    const analysis = analyzeProduct(parsed.value as ProductInput);
    const report = assembleProductReport({
      sku: 'replay_doctor',
      analysis,
      confidence: 0.9,
      aiAuthored: true,
      extraRecommendations: ['Tighten the queen funnel.'],
    });
    expect(report.title).toBe('ReplayDoctor');
    expect(report.version).toContain('replay_doctor');
    expect(report.aiAuthored).toBe(true);
    expect(report.recommendations).toContain('Tighten the queen funnel.');

    const html = renderProductReportHtml(report);
    expect(html).toContain('ReplayDoctor');
    expect(html).toContain('Mistakes');
    expect(html).toContain(report.version);
    expect(html).toContain('not endorsed by Supercell');
  });

  it('HTML-escapes interpolated content', () => {
    const report = assembleProductReport({
      sku: 'base_doctor',
      analysis: {
        score: null,
        summary: 'Danger <script>alert(1)</script>',
        sections: [{ key: 's', title: 'S', items: ['<b>x</b>'] }],
        recommendations: ['ok'],
      },
    });
    const html = renderProductReportHtml(report);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
