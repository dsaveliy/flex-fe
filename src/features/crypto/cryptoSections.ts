import type { IconName } from '@/ui';

/** готовые разделы под поиском; «Мой стол» — настраиваемые виджеты пользователя */
export type CryptoSection =
  | 'desktop'
  | 'rates'
  | 'news'
  | 'trade'
  | 'convert'
  | 'fiat'
  | 'portfolio'
  | 'earn';

export const CRYPTO_SECTIONS: { id: CryptoSection; icon: IconName }[] = [
  { id: 'desktop', icon: 'grid' },
  { id: 'rates', icon: 'chart' },
  { id: 'news', icon: 'news' },
  { id: 'trade', icon: 'candles' },
  { id: 'convert', icon: 'swap' },
  { id: 'fiat', icon: 'banknote' },
  { id: 'portfolio', icon: 'pie' },
  { id: 'earn', icon: 'coins' },
];
