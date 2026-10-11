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

/** валюты, в которых можно показывать общий баланс */
export type DisplayCurrency = 'BYN' | 'USD' | 'EUR' | 'BTC';

/** курсы к базовой валюте (из таблицы `exchange_rates` бэкенда) */
export type ExchangeRates = {
  /** базовая валюта, в которой хранятся суммы `valueBase` и история баланса */
  base: 'BYN';
  /** сколько базовой валюты стоит 1 единица валюты: USD → 3.27 */
  rates: Record<DisplayCurrency, number>;
  /** время обновления курсов, ISO 8601 */
  updatedAt: string;
};

/** периоды графика баланса на главном экране */
export type BalancePeriod = '1D' | '1W' | '1M' | '1Y' | 'ALL';

/** отдельный счёт пользователя: фиатный или криптовалютный */
export type AccountBalance = {
  id: string;
  /** ISO-код валюты или тикер монеты: BYN, USD, BTC, ETH */
  currency: string;
  kind: 'fiat' | 'crypto';
  name: string;
  /** сумма в валюте счёта; для крипты минорные единицы — 1e-8 (сатоши) */
  amount: Money;
  /** число знаков после запятой у `amount` */
  amountDigits: number;
  /** стоимость счёта в базовой валюте (BYN) */
  valueBase: Money;
  changePercent: number;
  /** hex-цвет счёта для графиков и значков */
  color: string;
  series: number[];
};

export type BalanceSummary = {
  total: Money;
  /** изменение по сравнению с предыдущим месяцем в процентах */
  monthChangePercent: number;
  /** история общего баланса в базовой валюте (основные единицы) по периодам */
  history: Record<BalancePeriod, number[]>;
  accounts: AccountBalance[];
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

/**
 * реквизиты карты. отдаются отдельным запросом и только по требованию —
 * чувствительные данные не должны приходить вместе со списком карт.
 */
export type BankCardDetails = {
  cardId: string;
  /** полный номер, 16 цифр без пробелов */
  pan: string;
  /** срок действия в формате MM/YY */
  expiry: string;
  cvv: string;
  /** имя держателя латиницей, как на пластике */
  holderName: string;
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

/** вид виджета на рабочем столе Crypto; пул расширяется вместе с реестром на фронте */
export type WidgetKind =
  | 'assetRate'
  | 'portfolio'
  | 'movers'
  | 'watchlist'
  | 'news'
  | 'convert'
  | 'fearGreed';

/** размер в ячейках сетки из 2 колонок: small 1×1, medium 2×1, large 2×2 */
export type WidgetSize = 'small' | 'medium' | 'large';

export type CryptoWidget = {
  /** уникален в пределах раскладки пользователя */
  id: string;
  kind: WidgetKind;
  size: WidgetSize;
  /** настройки конкретного виджета, например выбранная монета */
  params?: CryptoWidgetParams;
};

/** настройки виджета; какие ключи допустимы, зависит от `kind` */
export type CryptoWidgetParams = {
  /** монета курса (`assetRate`) */
  assetId?: string;
  /** монеты списка наблюдения (`watchlist`) */
  assetIds?: string[];
  /** рост или падение (`movers`) */
  direction?: MoverDirection;
  /** пара быстрого обмена (`convert`) */
  from?: string;
  to?: string;
};

/** раскладка рабочего стола Crypto, хранится в настройках пользователя на бэкенде */
export type CryptoLayout = {
  /** порядок важен: сетка укладывает виджеты по нему */
  widgets: CryptoWidget[];
  /** временная метка в формате ISO 8601 */
  updatedAt: string;
};

export type NewsItem = {
  id: string;
  title: string;
  /** название издания */
  source: string;
  /** временная метка в формате ISO 8601 */
  publishedAt: string;
  /** тикер монеты, о которой новость, если она есть */
  assetSymbol?: string;
  url?: string;
};

export type FearGreedLevel = 'extremeFear' | 'fear' | 'neutral' | 'greed' | 'extremeGreed';

/** индекс страха и жадности рынка, 0 — паника, 100 — эйфория */
export type FearGreedIndex = {
  value: number;
  level: FearGreedLevel;
  /** значение днём ранее — для стрелки изменения */
  previousValue: number;
  updatedAt: string;
};

/** продукт стейкинга / Earn */
export type EarnProduct = {
  id: string;
  assetId: string;
  symbol: string;
  badgeColor: string;
  /** годовая доходность в процентах, например `4.8` */
  apyPercent: number;
  /** срок блокировки в днях; `null` — гибкий, вывод в любой момент */
  termDays: number | null;
  /** минимальная сумма в единицах монеты */
  minAmount: number;
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
