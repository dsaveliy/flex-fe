import type { AssetKind, MoverDirection } from './types';

/** единый источник ключей кэша TanStack Query */
export const queryKeys = {
  user: ['user'] as const,
  balance: ['balance'] as const,
  promo: ['promo'] as const,
  cards: ['cards'] as const,
  cardDetails: (cardId: string) => ['cards', cardId, 'details'] as const,
  transactions: (params?: { cardId?: string; limit?: number }) =>
    ['transactions', params?.cardId ?? 'all', params?.limit ?? 'all'] as const,
  markets: (kind?: AssetKind) => ['markets', kind ?? 'all'] as const,
  movers: (direction: MoverDirection) => ['movers', direction] as const,
  portfolio: ['portfolio'] as const,
  rates: ['rates'] as const,
  cryptoLayout: ['me', 'crypto-layout'] as const,
  news: (limit?: number) => ['news', limit ?? 'all'] as const,
  fearGreed: ['fear-greed'] as const,
  earnProducts: ['earn-products'] as const,
  linkedCards: ['linked-cards'] as const,
  cryptoAccess: ['auth', 'crypto-access'] as const,
};

/** данные crypto-api: удаляются из кэша, как только криптораздел закрывается */
export const cryptoProtectedKeys = [
  queryKeys.portfolio,
  queryKeys.cryptoLayout,
  queryKeys.earnProducts,
] as const;
