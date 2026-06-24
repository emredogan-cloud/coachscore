import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  analyzeBase,
  analyzeReplay,
  assembleProductReport,
  buildWarPlan,
} from '@/lib/products';
import { ProductCards } from '@/components/products/product-cards';
import { ProductReportViewCard } from '@/components/products/product-report-view';

const replayReport = assembleProductReport({
  sku: 'replay_doctor',
  analysis: analyzeReplay({
    townHall: 14,
    context: 'war',
    starsEarned: 2,
    destructionPct: 80,
    durationSec: 180,
    timeRemainingSec: 30,
    army: [],
    heroesUsed: [],
    heroesAvailable: [],
    spellsUsed: [],
  }),
});

describe('ProductReportViewCard', () => {
  it('renders the title, score, sections, recommendations, and version', () => {
    const html = renderToStaticMarkup(
      <ProductReportViewCard report={replayReport} />,
    );
    expect(html).toContain('ReplayDoctor');
    expect(html).toContain('Summary');
    expect(html).toContain('Recommendations');
    expect(html).toContain(replayReport.version);
    // The mandatory Supercell disclaimer is embedded in the report.
    expect(html).toContain('not endorsed by Supercell');
  });

  it('renders BaseDoctor and WarPlan reports through the same component', () => {
    const base = assembleProductReport({
      sku: 'base_doctor',
      analysis: analyzeBase({
        townHall: 14,
        layoutType: 'war',
        goal: 'war_defense',
        townHallCentralized: true,
        coreBuildings: [],
        airDefenseCount: 4,
        airDefenseSpread: true,
        trapCount: 12,
        wallsMaxed: false,
        screenshotsCount: 0,
      }),
    });
    const war = assembleProductReport({
      sku: 'war_plan',
      analysis: buildWarPlan({
        attackerTownHall: 14,
        defenderTownHall: 14,
        defenderBaseType: 'ring',
        objective: 'three_star',
        roster: { army: 'Hydra', heroes: [], armyStrength: 'high' },
        spellsAvailable: [],
      }),
    });
    expect(
      renderToStaticMarkup(<ProductReportViewCard report={base} />),
    ).toContain('BaseDoctor');
    expect(
      renderToStaticMarkup(<ProductReportViewCard report={war} />),
    ).toContain('WarPlan');
  });
});

describe('ProductCards', () => {
  it('lists all three products with prices and submission links', () => {
    const html = renderToStaticMarkup(<ProductCards />);
    expect(html).toContain('ReplayDoctor');
    expect(html).toContain('BaseDoctor');
    expect(html).toContain('WarPlan');
    expect(html).toContain('$9'); // 900¢ / 700¢ formatting
    expect(html).toContain('/products/replay_doctor');
    expect(html).toContain('/products/war_plan');
  });
});
