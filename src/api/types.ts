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

/** роль клиента: basic — фиатный банкинг, pro — плюс криптораздел (после KYC) */
export type Role = 'basic' | 'pro';

/** статус заявки KYC для криптоопераций */
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string;
  email: string;
  role: Role;
  kycStatus: KycStatus;
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
  /** счёт карты: с него переводят и на него пополняют */
  accountId: string;
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
  /** машинный код ошибки (`TOKEN_EXPIRED`, `FACTOR_INVALID`, …), см. `docs/auth.md` */
  code: string;
  message: string;
  /** сколько попыток ввода фактора осталось до временной блокировки */
  attemptsLeft?: number;
  /** через сколько секунд можно повторить (заголовок `Retry-After`) */
  retryAfter?: number;
  /** дополнительные поля ошибки, например `verificationId` при неподтверждённых контактах */
  details?: Record<string, unknown>;
};

/* ---------- аутентификация, docs/auth.md ---------- */

/** канал подтверждения контакта одноразовым кодом */
export type VerificationChannel = 'phone' | 'email';

export type RegisterRequest = {
  phone: string;
  email: string;
  password: string;
};

/** токены при регистрации не выдаются: сначала подтверждение контактов, затем вход */
export type RegisterResponse = {
  verificationId: string;
  channels: VerificationChannel[];
};

export type VerifyContactRequest = {
  verificationId: string;
  channel: VerificationChannel;
  code: string;
};

export type VerifyContactResponse = {
  /** каналы, которые ещё нужно подтвердить; пустой массив — можно входить */
  remaining: VerificationChannel[];
};

export type LoginRequest = {
  /** телефон или email */
  identifier: string;
  password: string;
  deviceId: string;
};

/** пара токенов Уровня 1 (JWS compact) */
export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshRequest = {
  refreshToken: string;
  deviceId: string;
};

/** второй фактор для входа в криптораздел */
export type CryptoFactor =
  | { type: 'pin'; pin: string }
  /** секрет устройства, который отдаётся только после Face ID / Touch ID */
  | { type: 'biometric'; credential: string };

export type CryptoLoginRequest = {
  factor: CryptoFactor;
  deviceId: string;
};

/** crypto-токен Уровня 2: без refresh, по истечении фактор запрашивается снова */
export type CryptoSession = {
  cryptoToken: string;
  /** таймаут неактивности, секунды; каждый запрос к crypto-api продлевает его */
  idleTimeoutSec: number;
  /** абсолютный предел жизни токена, ISO */
  expiresAt: string;
};

export type CryptoSetupRequest = {
  pin: string;
  deviceId: string;
};

export type CryptoBiometricRequest = {
  enabled: boolean;
  deviceId: string;
};

export type CryptoBiometricResponse = {
  /** секрет для Keychain; `null`, если биометрия выключена */
  credential: string | null;
};

/** всё, что нужно экрану Crypto, чтобы решить: KYC, настройка PIN, ввод фактора */
export type CryptoAccessStatus = {
  role: Role;
  kycStatus: KycStatus;
  /** крипто-PIN задан */
  factorConfigured: boolean;
  /** на этом устройстве включён вход по биометрии */
  biometricEnabled: boolean;
  /** временная блокировка после 3 неверных попыток, ISO */
  lockedUntil: string | null;
  /** 10 неудач подряд: только через поддержку */
  blocked: boolean;
};

/* ---------- операции с виртуальными деньгами, flex-be docs/api.md §6, §8–10 ---------- */

/** выпуск карты: банк выпускает только виртуальные */
export type IssueCardRequest = {
  brand: CardBrand;
  style: CardStyle;
};

/** счёт, открытый под обмен или покупку монеты (`POST /accounts`) */
export type OpenedAccount = {
  id: string;
  currency: string;
  kind: 'fiat' | 'crypto';
  name: string;
};

export type TransferRequest = {
  fromAccountId: string;
  /** номер клиента Flex в любом формате, например `+375 29 111-22-33` */
  recipientPhone: string;
  amountMinor: number;
  comment?: string;
};

export type TransferResult = {
  transactionId: string;
  status: 'completed';
  fromAccountId: string;
  /** имя получателя в виде «Анна К.» */
  recipientName: string;
  amount: Money;
  fee: Money;
  createdAt: string;
};

/** обмен между своими счетами; `amountMinor` — сколько списать со счёта `from` */
export type ExchangeRequest = {
  fromAccountId: string;
  toAccountId: string;
  amountMinor: number;
};

export type ExchangeResult = {
  transactionId: string;
  status: 'completed';
  fromAmount: Money;
  toAmount: Money;
  fee: Money;
  /** сколько единиц `to` за 1 единицу `from` */
  rate: number;
  createdAt: string;
};

/** карта другого банка, с которой пополняют счёт (хранятся только последние цифры) */
export type LinkedCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  expiry: string;
  holderName: string;
  createdAt: string;
};

export type LinkCardRequest = {
  pan: string;
  /** MM/YY */
  expiry: string;
  holderName: string;
};

export type TopUpRequest = {
  toAccountId: string;
  linkedCardId: string;
  amountMinor: number;
};

export type WithdrawalRequest = {
  fromAccountId: string;
  linkedCardId: string;
  amountMinor: number;
};

/** оплата картой: эмулятор терминала или QR-кода магазина */
export type PaymentRequest = {
  cardId: string;
  merchant: string;
  amountMinor: number;
  category?: TransactionCategory;
  channel?: 'pos' | 'online' | 'qr' | 'atm';
};

export type OperationResult = {
  transactionId: string;
  status: 'completed';
  amount: Money;
  fee: Money;
  createdAt: string;
};

export type EarnSubscribeRequest = {
  productId: string;
  /** в минорных единицах монеты продукта */
  amountMinor: number;
};

export type EarnPosition = {
  id: string;
  productId: string;
  assetId: string;
  symbol: string;
  badgeColor: string;
  principal: Money;
  apyPercent: number;
  termDays: number | null;
  startedAt: string;
  maturesAt: string | null;
  status: 'active' | 'matured' | 'redeemed';
  accruedInterest: Money;
  redeemedAt: string | null;
  interestPaid: Money | null;
};

export type PaymentResult = OperationResult & {
  /** списано с криптокошелька при оплате криптой (автоконвертация) */
  fundedWith?: Money | null;
  rate?: number | null;
  cashback: Money;
};

/* ───────────── чат (docs/chat.md) ───────────── */

/** `lobby` — общий чат всех клиентов, `direct` — личный, `support` — с поддержкой Flex */
export type ChatRoomKind = 'lobby' | 'direct' | 'support';

/** участник: хватает на аватар-инициалы и подпись */
export type ChatMember = {
  id: string;
  /** «Анна К.» — как `recipientName` у перевода */
  name: string;
  initials: string;
  /** сотрудник поддержки — значок «Проверенный Flex» (только в support) */
  isStaff: boolean;
  /** собеседник-бот Flex Lobby — подпись «бот» рядом с именем */
  isBot: boolean;
};

export type ChatEmoji = '👍' | '❤️' | '😂' | '🔥' | '🚀' | '🙏';

export type ChatReaction = { emoji: ChatEmoji; userIds: string[] };

export type ChatAttachment = {
  id: string;
  kind: 'image' | 'file';
  name: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  /** подписанная ссылка: `Image` не умеет слать заголовок Authorization */
  url: string;
  thumbnailUrl: string | null;
};

export type ChatMoney =
  | { type: 'transfer'; transactionId: string; amount: Money; status: 'completed' }
  | {
      type: 'request';
      requestId: string;
      amount: Money;
      status: 'pending' | 'paid' | 'declined';
      paidTransactionId: string | null;
    }
  | {
      type: 'gift';
      giftId: string;
      asset: 'BTC' | 'USDT';
      /** у получателя `null`, пока конверт не открыт */
      amount: Money | null;
      status: 'sealed' | 'opened';
      openedAt: string | null;
    };

export type ChatMessageKind = 'text' | 'system' | 'transfer' | 'request' | 'gift';

export type ChatMessage = {
  id: string;
  roomId: string;
  /** UUID отправителя: по нему свой пузырь «с часиками» заменяется сохранённым */
  clientId: string | null;
  kind: ChatMessageKind;
  /** `null` у системных сообщений */
  author: ChatMember | null;
  text: string;
  replyTo: { id: string; authorName: string; text: string } | null;
  reactions: ChatReaction[];
  attachments: ChatAttachment[];
  money: ChatMoney | null;
  /** ISO 8601, ставит сервер */
  createdAt: string;
};

export type ChatRoom = {
  id: string;
  kind: ChatRoomKind;
  title: string;
  /** собеседник в direct/support */
  peer: ChatMember | null;
  /** lobby — сколько клиентов онлайн; direct — 1, если собеседник онлайн */
  onlineCount: number;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  /** до какого сообщения прочитал собеседник — для ✓✓ */
  peerLastReadMessageId: string | null;
};

/** кадры клиента → сервера */
export type ChatClientFrame =
  | { type: 'auth'; token: string }
  | {
      type: 'send';
      clientId: string;
      roomId: string;
      text: string;
      replyToId?: string;
      attachmentIds?: string[];
    }
  | { type: 'react'; messageId: string; emoji: ChatEmoji }
  | { type: 'typing'; roomId: string }
  | { type: 'read'; roomId: string; messageId: string }
  | { type: 'ping' };

/** кадры сервера → клиента */
export type ChatServerFrame =
  | { type: 'ready'; me: ChatMember; rooms: ChatRoom[] }
  | { type: 'message'; message: ChatMessage }
  | { type: 'message_update'; message: ChatMessage }
  | { type: 'reaction'; roomId: string; messageId: string; reactions: ChatReaction[] }
  | { type: 'typing'; roomId: string; user: ChatMember }
  | { type: 'presence'; roomId: string; onlineCount: number }
  | { type: 'read'; roomId: string; userId: string; messageId: string }
  | { type: 'room'; room: ChatRoom }
  | { type: 'error'; code: string; message?: string; clientId?: string; retryAfter?: number }
  | { type: 'pong' };

/** `POST /chat/rooms/direct`: номер — как у перевода, `userId` — автор сообщения в Lobby */
export type ChatDirectBody = { phone: string } | { userId: string };

export type ChatMoneyRequestBody = { amountMinor: number; currency: string; comment?: string };

export type ChatGiftBody = { fromAccountId: string; amountMinor: number; comment?: string };
