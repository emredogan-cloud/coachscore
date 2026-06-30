/**
 * Regional pricing architecture (Phase 7).
 *
 * GeoIP-based currency localization with a hard USD fallback. The flow:
 *   request → `x-vercel-ip-country` header → currency → localized price → format
 *
 * Design decisions (rationale lives in FINAL_PREMIUM_VISUAL_REPORT.md):
 * - Localized prices are FIXED LOCAL PRICE POINTS, not live FX conversions. You
 *   set a psychological price per market (₺199, not "$7 × today's rate"), so the
 *   amount is stable and the charge is deterministic.
 * - USD is the base and the fallback: any country we don't map, and any
 *   (sku, currency) we haven't localized, shows the USD price in USD. No request
 *   ever fails to get a price.
 * - This module is display + proposal infrastructure. Charging a localized price
 *   additionally requires a payment-provider variant per (sku, currency); until
 *   those are provisioned the app shows USD (see `regional_pricing_enabled`).
 *
 * Pure + unit-tested.
 */

import { getTier } from './catalog';
import type { SkuId } from './types';

export const SUPPORTED_CURRENCIES = ['usd', 'try', 'eur', 'gbp'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'usd';

/** Eurozone ISO-3166 alpha-2 codes that should price in EUR. */
const EUROZONE: ReadonlySet<string> = new Set([
  'AD',
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MC',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
  'SM',
  'VA',
]);

/** Map an ISO country code → billing currency. Unknown/empty → USD fallback. */
export function currencyForCountry(country?: string | null): Currency {
  if (!country) return DEFAULT_CURRENCY;
  const c = country.trim().toUpperCase();
  if (c === 'TR') return 'try';
  if (c === 'GB') return 'gbp';
  if (EUROZONE.has(c)) return 'eur';
  return DEFAULT_CURRENCY;
}

/** Minimal shape shared by `Headers` and Next's `headers()` result. */
export interface HeaderLike {
  get(name: string): string | null;
}

/** The visitor's country from Vercel's GeoIP header (null when absent/local). */
export function geoCountry(headers: HeaderLike): string | null {
  return headers.get('x-vercel-ip-country');
}

/** The visitor's billing currency from GeoIP headers (USD fallback). */
export function geoCurrency(headers: HeaderLike): Currency {
  return currencyForCountry(geoCountry(headers));
}

export interface Money {
  readonly currency: Currency;
  /** Amount in the currency's minor unit (cents / kuruş / pence). */
  readonly minor: number;
}

/**
 * Fixed local price points in each currency's MINOR unit. Proposal values at
 * psychological thresholds (validate before charging). Only the purchasable
 * public tiers are localized; everything else falls back to USD.
 */
const PRICE_BOOK: Partial<Record<Currency, Partial<Record<SkuId, number>>>> = {
  eur: { basic: 700, account_rescue: 1900 },
  gbp: { basic: 599, account_rescue: 1700 },
  try: { basic: 19900, account_rescue: 49900 },
};

/**
 * The localized price for a SKU in a currency. Falls back to the USD price (in
 * USD) when the currency is USD or the pair isn't localized — so the result is
 * always a valid, charge-consistent Money.
 */
export function localizedPrice(sku: SkuId, currency: Currency): Money {
  const usd: Money = { currency: 'usd', minor: getTier(sku).priceUsdCents };
  if (currency === 'usd') return usd;
  const minor = PRICE_BOOK[currency]?.[sku];
  return minor === undefined ? usd : { currency, minor };
}

const LOCALE_FOR: Record<Currency, string> = {
  usd: 'en-US',
  try: 'tr-TR',
  eur: 'en-IE',
  gbp: 'en-GB',
};

/**
 * Human-readable price, e.g. "$7", "£5.99", "₺199". Whole amounts drop the
 * decimals (matching the catalog's `formatPrice`); fractional amounts keep two.
 */
export function formatMoney(money: Money): string {
  const major = money.minor / 100;
  const whole = Number.isInteger(major);
  return new Intl.NumberFormat(LOCALE_FOR[money.currency], {
    style: 'currency',
    currency: money.currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(major);
}

/** Convenience: format a SKU's localized price in one call. */
export function formatLocalizedPrice(sku: SkuId, currency: Currency): string {
  return formatMoney(localizedPrice(sku, currency));
}
