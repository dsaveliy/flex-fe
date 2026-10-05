import type { Money } from '@/utils/money';

/**
 * Domain types for the mobile client.
 *
 * They are intentionally flat and close to what the FastAPI backend is
 * expected to expose, so they can later be replaced by types generated from
 * the OpenAPI schema with minimal changes (keep names and field shapes).
 */

export type Trend = {
  /** Percent change, e.g. -0.87 means -0.87%. */
  changePercent: number;
  /** Optional sparkline series (~24 points). */
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
  /** Change vs previous month in percent. */
  monthChangePercent: number;
};

export type QuickActionId = 'transfer' | 'topUp' | 'buyCrypto';

export type CardBrand = 'visa' | 'mastercard';
export type CardStyle = 'mint' | 'dark' | 'grey' | 'purple';
export type CardStatus = 'active' | 'frozen';

export type BankCard = {
  id: string;
  /** Product label shown on the plastic, e.g. "Flex". */
  productName: string;
  brand: CardBrand;
  /** "Debit" / "Credit" — translated on the client via i18n keys. */
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
  /** ISO 8601 timestamp. */
  occurredAt: string;
};

export type AssetKind = 'crypto' | 'fiat' | 'stock';

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  /** Price in `quoteCurrency`. */
  price: number;
  quoteCurrency: string;
  trend: Trend;
  /** Hex color used by the coin badge. */
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
  /** Share of the portfolio, 0..1. */
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
  /** Deep link handled by Expo Router, e.g. `/savings`. */
  href?: string;
};

/** Normalized API error used by the query layer. */
export type ApiErrorShape = {
  status: number;
  code: string;
  message: string;
};
