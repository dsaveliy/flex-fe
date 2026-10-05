import type { AssetKind, MoverDirection } from './types';

/** единый источник ключей кэша TanStack Query */
export const queryKeys = {
  user: ['user'] as const,
  balance: ['balance'] as const,
  promo: ['promo'] as const,
  cards: ['cards'] as const,
  transactions: (params?: { cardId?: string; limit?: number }) =>
    ['transactions', params?.cardId ?? 'all', params?.limit ?? 'all'] as const,
  markets: (kind?: AssetKind) => ['markets', kind ?? 'all'] as const,
  movers: (direction: MoverDirection) => ['movers', direction] as const,
  portfolio: ['portfolio'] as const,
};
