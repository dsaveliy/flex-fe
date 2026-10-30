import { API_BASE_URL, USE_MOCK_API, USE_MOCK_CHAT } from './config';
import { type AuthScope, createHttpTransport, idempotent } from './client';
import { mockApi } from './mock';
import { mockChatApi } from './mock/chat';
import type {
  AssetKind,
  BalanceSummary,
  BankCard,
  BankCardDetails,
  ChatDirectBody,
  ChatMessage,
  ChatRoom,
  CryptoAccessStatus,
  CryptoBiometricRequest,
  CryptoBiometricResponse,
  CryptoLayout,
  CryptoLoginRequest,
  CryptoSession,
  CryptoSetupRequest,
  EarnPosition,
  EarnProduct,
  EarnSubscribeRequest,
  ExchangeRequest,
  ExchangeResult,
  FearGreedIndex,
  ExchangeRates,
  IssueCardRequest,
  LinkCardRequest,
  LinkedCard,
  LoginRequest,
  MarketAsset,
  Mover,
  MoverDirection,
  NewsItem,
  OpenedAccount,
  OperationResult,
  PaymentRequest,
  PaymentResult,
  Portfolio,
  PromoOffer,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  TokenPair,
  TopUpRequest,
  Transaction,
  TransferRequest,
  TransferResult,
  User,
  WithdrawalRequest,
  VerificationChannel,
  VerifyContactRequest,
  VerifyContactResponse,
} from './types';

/** контракт, общий для mock- и настоящей реализации бэкенда */
export type FlexApi = {
  // аутентификация, Уровень 1 (docs/auth.md)
  register(body: RegisterRequest): Promise<RegisterResponse>;
  verifyContact(body: VerifyContactRequest): Promise<VerifyContactResponse>;
  resendCode(body: { verificationId: string; channel: VerificationChannel }): Promise<void>;
  login(body: LoginRequest): Promise<TokenPair>;
  refresh(body: RefreshRequest): Promise<TokenPair>;
  logout(): Promise<void>;
  // криптораздел, Уровень 2
  getCryptoAccess(params: { deviceId: string }): Promise<CryptoAccessStatus>;
  submitKyc(): Promise<void>;
  cryptoSetup(body: CryptoSetupRequest): Promise<void>;
  cryptoLogin(body: CryptoLoginRequest): Promise<CryptoSession>;
  cryptoLogout(): Promise<void>;
  setCryptoBiometric(body: CryptoBiometricRequest): Promise<CryptoBiometricResponse>;
  // данные
  getUser(): Promise<User>;
  getBalance(): Promise<BalanceSummary>;
  getPromo(): Promise<PromoOffer>;
  getCards(): Promise<BankCard[]>;
  getCardDetails(cardId: string): Promise<BankCardDetails>;
  getTransactions(params?: { cardId?: string; limit?: number }): Promise<Transaction[]>;
  getMarkets(params?: { kind?: AssetKind }): Promise<MarketAsset[]>;
  getMovers(direction: MoverDirection): Promise<Mover[]>;
  getPortfolio(): Promise<Portfolio>;
  getRates(): Promise<ExchangeRates>;
  getCryptoLayout(): Promise<CryptoLayout>;
  saveCryptoLayout(widgets: CryptoLayout['widgets']): Promise<CryptoLayout>;
  getNews(params?: { limit?: number }): Promise<NewsItem[]>;
  getFearGreed(): Promise<FearGreedIndex>;
  getEarnProducts(): Promise<EarnProduct[]>;
  // операции с виртуальными деньгами; денежные — с ключом идемпотентности
  issueCard(body: IssueCardRequest): Promise<BankCard>;
  setCardFrozen(cardId: string, frozen: boolean): Promise<BankCard>;
  openAccount(currency: string): Promise<OpenedAccount>;
  getLinkedCards(): Promise<LinkedCard[]>;
  linkCard(body: LinkCardRequest): Promise<LinkedCard>;
  topUp(body: TopUpRequest, idempotencyKey: string): Promise<OperationResult>;
  withdraw(body: WithdrawalRequest, idempotencyKey: string): Promise<OperationResult>;
  pay(body: PaymentRequest, idempotencyKey: string): Promise<PaymentResult>;
  transfer(body: TransferRequest, idempotencyKey: string): Promise<TransferResult>;
  exchange(body: ExchangeRequest, idempotencyKey: string): Promise<ExchangeResult>;
  convert(body: ExchangeRequest, idempotencyKey: string): Promise<ExchangeResult>;
  subscribeEarn(body: EarnSubscribeRequest): Promise<EarnPosition>;
  // чат (docs/chat.md): живые сообщения — по WebSocket (`src/api/chat`), история — по REST
  getChatRooms(): Promise<ChatRoom[]>;
  getChatMessages(
    roomId: string,
    params?: { before?: string; limit?: number },
  ): Promise<ChatMessage[]>;
  /** личный чат по номеру или с автором из Lobby; уже переписывались — та же комната */
  openDirectChat(body: ChatDirectBody): Promise<ChatRoom>;
};

/**
 * какой токен нужен каждому методу — по матрице доступа ТЗ (раздел 6).
 * по этой карте HTTP-транспорт ставит заголовок, а `authInterceptor`
 * решает, обновлять ли access и продлевать ли crypto-сессию
 */
export const API_AUTH_SCOPE: Record<keyof FlexApi, AuthScope> = {
  register: 'none',
  verifyContact: 'none',
  resendCode: 'none',
  login: 'none',
  refresh: 'refresh',
  logout: 'access',
  getCryptoAccess: 'access',
  submitKyc: 'access',
  cryptoSetup: 'access',
  cryptoLogin: 'access',
  cryptoLogout: 'crypto',
  setCryptoBiometric: 'crypto',
  getUser: 'access',
  getBalance: 'access',
  getPromo: 'access',
  getCards: 'access',
  getCardDetails: 'access',
  getTransactions: 'access',
  // курсы, новости и рынок открыты даже гостю
  getMarkets: 'none',
  getMovers: 'none',
  getRates: 'none',
  getNews: 'none',
  getFearGreed: 'none',
  // кошелёк и всё, что внутри криптораздела, — только с crypto-токеном
  getPortfolio: 'crypto',
  getCryptoLayout: 'crypto',
  saveCryptoLayout: 'crypto',
  getEarnProducts: 'crypto',
  issueCard: 'access',
  setCardFrozen: 'access',
  openAccount: 'access',
  getLinkedCards: 'access',
  linkCard: 'access',
  topUp: 'access',
  withdraw: 'access',
  pay: 'access',
  transfer: 'access',
  // обмен фиата — Уровень 1, всё с криптой — только с crypto-токеном
  exchange: 'access',
  convert: 'crypto',
  subscribeEarn: 'crypto',
  getChatRooms: 'access',
  getChatMessages: 'access',
  openDirectChat: 'access',
};

function createHttpApi(baseUrl: string): FlexApi {
  const transport = createHttpTransport(baseUrl);
  const as = (method: keyof FlexApi) => ({ auth: API_AUTH_SCOPE[method] });

  return {
    register: (body) => transport.post<RegisterResponse>('/auth/register', body, as('register')),
    verifyContact: (body) =>
      transport.post<VerifyContactResponse>('/auth/verify', body, as('verifyContact')),
    resendCode: (body) => transport.post<void>('/auth/verify/resend', body, as('resendCode')),
    login: (body) => transport.post<TokenPair>('/auth/login', body, as('login')),
    refresh: (body) => transport.post<TokenPair>('/auth/refresh', body, as('refresh')),
    logout: () => transport.post<void>('/auth/logout', undefined, as('logout')),
    getCryptoAccess: ({ deviceId }) =>
      transport.get<CryptoAccessStatus>(
        `/auth/crypto/status?device_id=${encodeURIComponent(deviceId)}`,
        as('getCryptoAccess'),
      ),
    submitKyc: () => transport.post<void>('/kyc/applications', undefined, as('submitKyc')),
    cryptoSetup: (body) => transport.post<void>('/auth/crypto/setup', body, as('cryptoSetup')),
    cryptoLogin: (body) =>
      transport.post<CryptoSession>('/auth/crypto/login', body, as('cryptoLogin')),
    cryptoLogout: () => transport.post<void>('/auth/crypto/logout', undefined, as('cryptoLogout')),
    setCryptoBiometric: (body) =>
      transport.post<CryptoBiometricResponse>(
        '/auth/crypto/biometric',
        body,
        as('setCryptoBiometric'),
      ),

    getUser: () => transport.get<User>('/me', as('getUser')),
    getBalance: () => transport.get<BalanceSummary>('/balance', as('getBalance')),
    getPromo: () => transport.get<PromoOffer>('/promo', as('getPromo')),
    getCards: () => transport.get<BankCard[]>('/cards', as('getCards')),
    getCardDetails: (cardId) =>
      transport.get<BankCardDetails>(
        `/cards/${encodeURIComponent(cardId)}/details`,
        as('getCardDetails'),
      ),
    getTransactions: (params) => {
      const query = new URLSearchParams();
      if (params?.cardId) query.set('card_id', params.cardId);
      if (params?.limit) query.set('limit', String(params.limit));
      const suffix = query.size > 0 ? `?${query.toString()}` : '';
      return transport.get<Transaction[]>(`/transactions${suffix}`, as('getTransactions'));
    },
    getMarkets: (params) =>
      transport.get<MarketAsset[]>(
        params?.kind ? `/markets?kind=${params.kind}` : '/markets',
        as('getMarkets'),
      ),
    getMovers: (direction) =>
      transport.get<Mover[]>(`/markets/movers?direction=${direction}`, as('getMovers')),
    getPortfolio: () => transport.get<Portfolio>('/portfolio', as('getPortfolio')),
    getRates: () => transport.get<ExchangeRates>('/exchange-rates', as('getRates')),
    getCryptoLayout: () => transport.get<CryptoLayout>('/me/crypto-layout', as('getCryptoLayout')),
    saveCryptoLayout: (widgets) =>
      transport.put<CryptoLayout>('/me/crypto-layout', { widgets }, as('saveCryptoLayout')),
    getNews: (params) =>
      transport.get<NewsItem[]>(
        params?.limit ? `/news?limit=${params.limit}` : '/news',
        as('getNews'),
      ),
    getFearGreed: () => transport.get<FearGreedIndex>('/markets/fear-greed', as('getFearGreed')),
    getEarnProducts: () => transport.get<EarnProduct[]>('/earn/products', as('getEarnProducts')),

    issueCard: (body) => transport.post<BankCard>('/cards', body, as('issueCard')),
    setCardFrozen: (cardId, frozen) =>
      transport.post<BankCard>(
        `/cards/${encodeURIComponent(cardId)}/${frozen ? 'freeze' : 'unfreeze'}`,
        undefined,
        as('setCardFrozen'),
      ),
    openAccount: (currency) =>
      transport.post<OpenedAccount>('/accounts', { currency }, as('openAccount')),
    getLinkedCards: () => transport.get<LinkedCard[]>('/linked-cards', as('getLinkedCards')),
    linkCard: (body) => transport.post<LinkedCard>('/linked-cards', body, as('linkCard')),
    topUp: (body, key) =>
      transport.post<OperationResult>('/topups', body, { ...as('topUp'), init: idempotent(key) }),
    withdraw: (body, key) =>
      transport.post<OperationResult>('/withdrawals', body, {
        ...as('withdraw'),
        init: idempotent(key),
      }),
    pay: (body, key) =>
      transport.post<PaymentResult>('/payments', body, { ...as('pay'), init: idempotent(key) }),
    transfer: (body, key) =>
      transport.post<TransferResult>('/transfers', body, {
        ...as('transfer'),
        init: idempotent(key),
      }),
    exchange: (body, key) =>
      transport.post<ExchangeResult>('/exchanges', body, {
        ...as('exchange'),
        init: idempotent(key),
      }),
    convert: (body, key) =>
      transport.post<ExchangeResult>('/convert', body, { ...as('convert'), init: idempotent(key) }),
    subscribeEarn: (body) =>
      transport.post<EarnPosition>('/earn/positions', body, as('subscribeEarn')),

    getChatRooms: () => transport.get<ChatRoom[]>('/chat/rooms', as('getChatRooms')),
    getChatMessages: (roomId, params) => {
      const query = new URLSearchParams();
      if (params?.before) query.set('before', params.before);
      if (params?.limit) query.set('limit', String(params.limit));
      const suffix = query.size > 0 ? `?${query.toString()}` : '';
      return transport.get<ChatMessage[]>(
        `/chat/rooms/${encodeURIComponent(roomId)}/messages${suffix}`,
        as('getChatMessages'),
      );
    },
    openDirectChat: (body) =>
      transport.post<ChatRoom>('/chat/rooms/direct', body, as('openDirectChat')),
  };
}

/**
 * «сырой» API без обработки токенов. экраны используют `api` из `./api.ts`
 * (обёртка `withAuth`); напрямую `baseApi` нужен только ядру сессии
 * (`src/auth/sessionActions.ts`), чтобы обновление токенов не зацикливалось
 */
export const baseApi: FlexApi = USE_MOCK_API
  ? mockApi
  : USE_MOCK_CHAT
    ? { ...createHttpApi(API_BASE_URL), ...mockChatApi }
    : createHttpApi(API_BASE_URL);
