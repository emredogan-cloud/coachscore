import { describe, expect, it } from 'vitest';
import {
  currencyForCountry,
  formatLocalizedPrice,
  formatMoney,
  geoCountry,
  geoCurrency,
  localizedPrice,
} from '@/lib/pricing/regional';
import { getTier } from '@/lib/pricing';

/** A `Headers`-like stub for the GeoIP header tests. */
function headers(country?: string) {
  return {
    get: (name: string) =>
      name === 'x-vercel-ip-country' && country ? country : null,
  };
}

describe('currencyForCountry', () => {
  it('maps the known markets', () => {
    expect(currencyForCountry('TR')).toBe('try');
    expect(currencyForCountry('GB')).toBe('gbp');
    expect(currencyForCountry('DE')).toBe('eur');
    expect(currencyForCountry('FR')).toBe('eur');
  });

  it('normalizes case and whitespace', () => {
    expect(currencyForCountry(' tr ')).toBe('try');
    expect(currencyForCountry('gb')).toBe('gbp');
  });

  it('falls back to USD for unknown, empty, null, or undefined', () => {
    expect(currencyForCountry('US')).toBe('usd');
    expect(currencyForCountry('JP')).toBe('usd');
    expect(currencyForCountry('')).toBe('usd');
    expect(currencyForCountry(null)).toBe('usd');
    expect(currencyForCountry(undefined)).toBe('usd');
  });
});

describe('GeoIP header parsing', () => {
  it('reads the country from the Vercel header', () => {
    expect(geoCountry(headers('TR'))).toBe('TR');
    expect(geoCountry(headers())).toBeNull();
  });

  it('resolves currency from headers with a USD fallback', () => {
    expect(geoCurrency(headers('GB'))).toBe('gbp');
    expect(geoCurrency(headers('DE'))).toBe('eur');
    expect(geoCurrency(headers())).toBe('usd');
  });
});

describe('localizedPrice', () => {
  it('returns USD for USD requests', () => {
    expect(localizedPrice('basic', 'usd')).toEqual({
      currency: 'usd',
      minor: getTier('basic').priceUsdCents,
    });
  });

  it('returns the localized price point where one exists', () => {
    expect(localizedPrice('basic', 'try')).toEqual({
      currency: 'try',
      minor: 19900,
    });
    expect(localizedPrice('account_rescue', 'gbp')).toEqual({
      currency: 'gbp',
      minor: 1700,
    });
    expect(localizedPrice('basic', 'eur')).toEqual({
      currency: 'eur',
      minor: 700,
    });
  });

  it('falls back to USD for a non-localized (sku, currency) pair', () => {
    // `standard` isn't in the price book → show the USD price in USD.
    expect(localizedPrice('standard', 'try')).toEqual({
      currency: 'usd',
      minor: getTier('standard').priceUsdCents,
    });
  });
});

describe('formatMoney', () => {
  it('drops decimals for whole amounts and keeps them otherwise', () => {
    const usd = formatMoney({ currency: 'usd', minor: 700 });
    expect(usd).toContain('7');
    expect(usd).not.toContain('.00');

    const gbp = formatMoney({ currency: 'gbp', minor: 599 });
    expect(gbp).toContain('5.99');
  });

  it('formats each supported currency with its numeric value', () => {
    expect(formatMoney({ currency: 'try', minor: 19900 })).toContain('199');
    expect(formatMoney({ currency: 'eur', minor: 700 })).toContain('7');
  });

  it('formatLocalizedPrice composes lookup + formatting', () => {
    expect(formatLocalizedPrice('basic', 'try')).toContain('199');
    expect(formatLocalizedPrice('basic', 'usd')).toContain('7');
  });
});
