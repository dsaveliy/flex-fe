import { getIntlLocale } from '@/i18n';

/**
 * деньги всегда хранятся как целые минорные единицы (центы) и ISO-код валюты —
 * именно так их должен возвращать бэкенд на FastAPI.
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
  /** показывать код или символ валюты. по умолчанию: true */
  withCurrency?: boolean;
  /** принудительно показывать знак для положительных чисел (например, `+2,850.00`) */
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
  locale?: string;
  minorUnitDigits?: number;
};

/** `124900 BYN` -> `1,249.00 BYN` (с учётом локали) */
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

/** делит сумму на целую и дробную части для крупной типографики баланса */
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

/** рыночные цены приходят из API десятичными числами, а не минорными единицами */
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
