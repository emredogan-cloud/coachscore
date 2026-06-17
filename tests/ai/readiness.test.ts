import { describe, expect, it } from 'vitest';
import { assertPaidReportAllowed, referenceDataReadiness } from '@/lib/ai';

describe('reference-data readiness gate', () => {
  it('reports unverified fields for a Town Hall with verification debt', () => {
    // TH14 hero caps are verified, but category tables are still flagged.
    const r = referenceDataReadiness(14);
    expect(r.ready).toBe(false);
    expect(r.unverifiedCount).toBeGreaterThan(0);
    expect(r.unverifiedFields.every((f) => f.startsWith('TH14 '))).toBe(true);
  });

  it('blocks paid generation while reference data is unverified', () => {
    expect(() => assertPaidReportAllowed(14)).toThrow(/Paid report blocked/);
  });

  it('scopes readiness to the requested Town Hall only', () => {
    const r13 = referenceDataReadiness(13);
    expect(r13.unverifiedFields.every((f) => f.startsWith('TH13 '))).toBe(true);
  });
});
