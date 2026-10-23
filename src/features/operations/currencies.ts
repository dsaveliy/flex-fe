import type { MarketAsset } from '@/api';

/** валюты счетов на сервере (таблица `currencies`): остальные монеты рынка только котируются */
export const FIAT_CURRENCIES = ['BYN', 'USD', 'EUR', 'PLN', 'RUB'] as const;
export const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'USDT', 'SOL'] as const;

export const isCrypto = (currency: string) =>
  (CRYPTO_CURRENCIES as readonly string[]).includes(currency);

/** знаков в минорных единицах: сатоши у крипты, копейки у фиата */
export const currencyDigits = (currency: string) => (isCrypto(currency) ? 8 : 2);

/**
 * BYN за 1 единицу валюты по котировкам рынка: фиат котируется в BYN,
 * крипта в USD. только для предпросмотра — итог считает сервер
 */
export function rateByn(currency: string, markets: MarketAsset[]): number | null {
  if (currency === 'BYN') return 1;
  const asset = markets.find((item) => item.symbol === currency);
  if (!asset) return null;
  if (asset.quoteCurrency === 'BYN') return asset.price;
  const usd = markets.find((item) => item.symbol === 'USD');
  return usd ? asset.price * usd.price : null;
}
