import type { MarketAsset } from '@/api';
import { getIntlLocale } from '@/i18n';

/** сколько единиц `to` дают за 1 `from`; обе цены в одной котируемой валюте (USD) */
export function pairRate(from: MarketAsset, to: MarketAsset): number {
  return to.price > 0 ? from.price / to.price : 0;
}

/** количество монет без знака валюты: крупные — без дробей, мелкие — до 6 знаков */
export function formatCoinAmount(value: number): string {
  const abs = Math.abs(value);
  return new Intl.NumberFormat(getIntlLocale(), {
    maximumFractionDigits: abs >= 1000 ? 0 : abs >= 1 ? 2 : 6,
  }).format(value);
}
