import type { Money } from '@/utils/money';

/**
 * доменные типы мобильного клиента.
 *
 * они намеренно плоские и близки к тому, что должен отдавать бэкенд на
 * FastAPI, чтобы позже их можно было заменить типами, сгенерированными из
 * схемы OpenAPI, с минимальными изменениями (имена и форма полей сохраняются).
 */

export type Trend = {
  /** изменение в процентах, например -0.87 означает -0.87% */
  changePercent: number;
  /** необязательный ряд для sparkline (~24 точки) */
  series?: number[];
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type BalanceSummary = {
  total: Money;
  /** изменение по сравнению с предыдущим месяцем в процентах */
  monthChangePercent: number;
};

export type QuickActionId = 'transfer' | 'topUp' | 'buyCrypto';

export type CardBrand = 'visa' | 'mastercard';
export type CardStyle = 'mint' | 'dark' | 'grey' | 'purple';
export type CardStatus = 'active' | 'frozen';

export type BankCard = {
  id: string;
  /** название продукта на пластике, например "Flex" */
  productName: string;
  brand: CardBrand;
  /** "Debit" / "Credit" — переводится на клиенте через ключи i18n */
  kind: 'debit' | 'credit';
  last4: string;
  balance: Money;
  style: CardStyle;
  status: CardStatus;
  contactless: boolean;
};

export type TransactionDirection = 'incoming' | 'outgoing';

export type TransactionCategory =
  | 'shopping'
  | 'salary'
  | 'cafe'
  | 'transport'
  | 'transfer'
  | 'subscription'
  | 'other';

export type Transaction = {
  id: string;
  cardId: string;
  merchant: string;
  category: TransactionCategory;
  direction: TransactionDirection;
  amount: Money;
  /** временная метка в формате ISO 8601 */
  occurredAt: string;
};

export type AssetKind = 'crypto' | 'fiat' | 'stock';

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  /** цена в `quoteCurrency` */
  price: number;
  quoteCurrency: string;
  trend: Trend;
  /** hex-цвет, используемый значком монеты */
  badgeColor: string;
};

export type MoverDirection = 'gainers' | 'losers';

export type Mover = {
  id: string;
  symbol: string;
  changePercent: number;
  badgeColor: string;
};

export type PortfolioHolding = {
  assetId: string;
  symbol: string;
  badgeColor: string;
  /** доля в портфеле, от 0 до 1 */
  weight: number;
};

export type Portfolio = {
  value: Money;
  dayChangePercent: number;
  series: number[];
  holdings: PortfolioHolding[];
};

export type PromoOffer = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  /** deep link, обрабатываемый Expo Router, например `/savings` */
  href?: string;
};

/** нормализованная ошибка API, используемая слоем запросов */
export type ApiErrorShape = {
  status: number;
  code: string;
  message: string;
};
