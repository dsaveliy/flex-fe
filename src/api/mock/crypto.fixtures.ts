import { palette } from '@/theme/palette';

import type { CryptoLayout, EarnProduct, FearGreedIndex, NewsItem } from '../types';

/** время «столько-то минут назад» — чтобы лента новостей всегда выглядела свежей */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** раскладка нового пользователя: по виджету каждого вида, чтобы стол не был пустым */
export function defaultCryptoLayout(): CryptoLayout {
  return {
    widgets: [
      { id: 'w-portfolio', kind: 'portfolio', size: 'medium' },
      { id: 'w-btc', kind: 'assetRate', size: 'small', params: { assetId: 'btc' } },
      { id: 'w-eth', kind: 'assetRate', size: 'small', params: { assetId: 'eth' } },
      { id: 'w-movers', kind: 'movers', size: 'medium', params: { direction: 'gainers' } },
      { id: 'w-fear', kind: 'fearGreed', size: 'small' },
      { id: 'w-convert', kind: 'convert', size: 'small', params: { from: 'btc', to: 'usdt' } },
      { id: 'w-news', kind: 'news', size: 'medium' },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export const mockNews: NewsItem[] = [
  {
    id: 'n1',
    title: 'Биткоин вернулся выше $99 000 на фоне притока в спотовые ETF',
    source: 'CoinDesk',
    publishedAt: minutesAgo(12),
    assetSymbol: 'BTC',
  },
  {
    id: 'n2',
    title: 'Ethereum готовит обновление сети: комиссии второго уровня снизятся',
    source: 'The Block',
    publishedAt: minutesAgo(47),
    assetSymbol: 'ETH',
  },
  {
    id: 'n3',
    title: 'Solana обновила рекорд по числу транзакций за сутки',
    source: 'Decrypt',
    publishedAt: minutesAgo(95),
    assetSymbol: 'SOL',
  },
  {
    id: 'n4',
    title: 'Регуляторы ЕС уточнили правила MiCA для стейблкоинов',
    source: 'Reuters',
    publishedAt: minutesAgo(160),
    assetSymbol: 'USDT',
  },
  {
    id: 'n5',
    title: 'Объём торгов на криптобиржах вырос на 18% за неделю',
    source: 'Bloomberg',
    publishedAt: minutesAgo(240),
  },
  {
    id: 'n6',
    title: 'Аналитики: волатильность биткоина опустилась до минимума за год',
    source: 'CoinTelegraph',
    publishedAt: minutesAgo(380),
    assetSymbol: 'BTC',
  },
];

export const mockFearGreed: FearGreedIndex = {
  value: 68,
  level: 'greed',
  previousValue: 61,
  updatedAt: new Date().toISOString(),
};

export const mockEarnProducts: EarnProduct[] = [
  {
    id: 'earn-usdt-flex',
    assetId: 'usdt',
    symbol: 'USDT',
    badgeColor: palette.accent,
    apyPercent: 6.5,
    termDays: null,
    minAmount: 10,
  },
  {
    id: 'earn-eth-30',
    assetId: 'eth',
    symbol: 'ETH',
    badgeColor: palette.coinB,
    apyPercent: 4.2,
    termDays: 30,
    minAmount: 0.05,
  },
  {
    id: 'earn-sol-60',
    assetId: 'sol',
    symbol: 'SOL',
    badgeColor: palette.coinF,
    apyPercent: 7.1,
    termDays: 60,
    minAmount: 1,
  },
  {
    id: 'earn-btc-90',
    assetId: 'btc',
    symbol: 'BTC',
    badgeColor: palette.coinA,
    apyPercent: 2.4,
    termDays: 90,
    minAmount: 0.001,
  },
];
