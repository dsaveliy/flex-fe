import { getIntlLocale } from '@/i18n';

/**
 * Money is always stored as integer minor units (cents) + ISO currency code,
 * which is how the FastAPI backend is expected to return it.
 */
export type Money = {
  amountMinor: number;
  currency: string;
};

export function money(amountMinor: number, currency: string): Money {
  return { amountMinor, currency };
}

export function toMajorUnits(value: Money, minorUnitDigits = 2): number {
  return value.amountMinor / 10 ** minorUnitDigits;
}

type FormatMoneyOptions = {
  /** Show the currency code/symbol. Default: true. */
  withCurrency?: boolean;
  /** Force sign for positive numbers (e.g. `+2,850.00`). */
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
  locale?: string;
  minorUnitDigits?: number;
};

/** `124900 BYN` -> `1,249.00 BYN` (locale aware). */
export function formatMoney(value: Money, options: FormatMoneyOptions = {}): string {
  const {
    withCurrency = true,
    signDisplay = 'auto',
    locale = getIntlLocale(),
    minorUnitDigits = 2,
  } = options;

  const major = toMajorUnits(value, minorUnitDigits);
  const amount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: minorUnitDigits,
    maximumFractionDigits: minorUnitDigits,
    signDisplay,
  }).format(major);

  return withCurrency ? `${amount} ${value.currency}` : amount;
}

/** Splits money into integer / fraction parts for the big balance typography. */
export function splitMoneyParts(
  value: Money,
  options: { locale?: string; minorUnitDigits?: number } = {},
): { integer: string; fraction: string; currency: string } {
  const { locale = getIntlLocale(), minorUnitDigits = 2 } = options;
  const major = toMajorUnits(value, minorUnitDigits);

  const integer = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(Math.trunc(Math.abs(major)));

  const fractionValue = Math.round(
    (Math.abs(major) - Math.trunc(Math.abs(major))) * 10 ** minorUnitDigits,
  );
  const fraction = String(fractionValue).padStart(minorUnitDigits, '0');
  const sign = major < 0 ? '-' : '';

  return { integer: `${sign}${integer}`, fraction, currency: value.currency };
}

type FormatPriceOptions = {
  locale?: string;
  currency?: string;
  maximumFractionDigits?: number;
};

/** Market prices come from the API as decimals, not minor units. */
export function formatPrice(value: number, options: FormatPriceOptions = {}): string {
  const { locale = getIntlLocale(), currency = 'USD', maximumFractionDigits } = options;
  const digits =
    maximumFractionDigits ?? (Math.abs(value) >= 1000 ? 0 : Math.abs(value) >= 1 ? 2 : 4);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
    maximumFractionDigits: digits,
  }).format(value);
}
