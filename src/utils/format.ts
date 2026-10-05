import { getIntlLocale } from '@/i18n';

/** `2.4` -> `+2.4%`, `-0.87` -> `-0.87%` */
export function formatPercent(
  value: number,
  options: { locale?: string; withSign?: boolean; digits?: number } = {},
): string {
  const { locale = getIntlLocale(), withSign = true, digits = 2 } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: withSign ? 'exceptZero' : 'never',
  }).format(value).concat('%');
}

/** абсолютное значение процента для бейджей, которые сами рисуют стрелку */
export function formatPercentAbs(value: number, digits = 2): string {
  return formatPercent(Math.abs(value), { withSign: false, digits });
}

export type TrendDirection = 'up' | 'down' | 'flat';

export function trendOf(value: number): TrendDirection {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

/** строка даты ISO -> локализованная короткая дата, например `12 Feb` */
export function formatShortDate(iso: string, locale = getIntlLocale()): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso));
}

export function formatTime(iso: string, locale = getIntlLocale()): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

export type GreetingSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export function greetingSlotFor(date = new Date()): GreetingSlot {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

/** `4821` -> `•••• 4821` */
export function maskCardNumber(last4: string): string {
  return `•••• ${last4}`;
}
