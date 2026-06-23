import { describe, expect, it } from 'vitest';
import { buildShareCard } from '@/lib/share';

describe('buildShareCard', () => {
  it('builds a headline and subtitle from the score', () => {
    const card = buildShareCard({
      grade: 'A',
      overall: 85,
      townHall: 14,
      goal: 'war',
    });
    expect(card.headline).toBe('Grade A · 85/100');
    expect(card.subtitle).toBe('Town Hall 14 · goal: war');
    expect(card.grade).toBe('A');
  });
});
