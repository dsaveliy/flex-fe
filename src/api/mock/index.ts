import type {
  AssetKind,
  BalanceSummary,
  BankCard,
  BankCardDetails,
  CryptoLayout,
  EarnProduct,
  FearGreedIndex,
  ExchangeRates,
  MarketAsset,
  Mover,
  MoverDirection,
  NewsItem,
  Portfolio,
  PromoOffer,
  Transaction,
  User,
} from '../types';
import { ApiError } from '../client';
import { respond } from './delay';
import { mockGainers, mockLosers, mockPortfolio, mockPromo, mockRates } from './fixtures';
import {
  defaultCryptoLayout,
  mockEarnProducts,
  mockFearGreed,
  mockNews,
} from './crypto.fixtures';
import { mockMarkets } from './markets.fixtures';
import { requireAccess, requireCrypto } from './auth/guards';
import { mockAuthApi } from './auth';
import { mockOperationsApi, mockOperationsState } from './operations';
import { mockChatApi } from './chat';

/**
 * имитация настроек пользователя на сервере: раскладка живёт в памяти до
 * перезапуска приложения
 */
let cryptoLayout: CryptoLayout = defaultCryptoLayout();

/**
 * mock-реализация будущих эндпоинтов FastAPI.
 * сигнатуры повторяют планируемые REST-маршруты, поэтому `services.ts` может
 * подменить реализацию, не затрагивая код фич.
 */
export const mockApi = {
  ...mockAuthApi,
  ...mockOperationsApi,
  ...mockChatApi,

  // приватные данные проверяются так же, как на бэкенде: access или crypto-токен (guards.ts)
  getUser: async (): Promise<User> => {
    const { user } = await requireAccess();
    return respond({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: null,
      phone: user.phone,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
    });
  },

  getBalance: async (): Promise<BalanceSummary> => {
    await requireAccess();
    return respond(mockOperationsState.balance());
  },

  getPromo: async (): Promise<PromoOffer> => {
    await requireAccess();
    return respond(mockPromo);
  },

  getCards: async (): Promise<BankCard[]> => {
    await requireAccess();
    return respond(mockOperationsState.cards());
  },

  getCardDetails: async (cardId: string): Promise<BankCardDetails> => {
    await requireAccess();
    const details = mockOperationsState.details().find((item) => item.cardId === cardId);
    if (!details) {
      throw new ApiError({ status: 404, code: 'card_not_found', message: 'Card not found' });
    }
    return respond(details);
  },

  getTransactions: async (params?: {
    cardId?: string;
    limit?: number;
  }): Promise<Transaction[]> => {
    await requireAccess();
    const all = mockOperationsState.transactions();
    const filtered = params?.cardId ? all.filter((item) => item.cardId === params.cardId) : all;
    return respond(params?.limit ? filtered.slice(0, params.limit) : filtered);
  },

  getMarkets: (params?: { kind?: AssetKind }): Promise<MarketAsset[]> => {
    const filtered = params?.kind
      ? mockMarkets.filter((item) => item.kind === params.kind)
      : mockMarkets;
    return respond(filtered);
  },

  getMovers: (direction: MoverDirection): Promise<Mover[]> =>
    respond(direction === 'gainers' ? mockGainers : mockLosers),

  getPortfolio: async (): Promise<Portfolio> => {
    await requireCrypto();
    return respond(mockPortfolio);
  },

  getRates: (): Promise<ExchangeRates> => respond(mockRates),

  getCryptoLayout: async (): Promise<CryptoLayout> => {
    await requireCrypto();
    return respond(cryptoLayout);
  },

  saveCryptoLayout: async (widgets: CryptoLayout['widgets']): Promise<CryptoLayout> => {
    await requireCrypto();
    cryptoLayout = { widgets, updatedAt: new Date().toISOString() };
    return respond(cryptoLayout);
  },

  getNews: (params?: { limit?: number }): Promise<NewsItem[]> =>
    respond(params?.limit ? mockNews.slice(0, params.limit) : mockNews),

  getFearGreed: (): Promise<FearGreedIndex> => respond(mockFearGreed),

  getEarnProducts: async (): Promise<EarnProduct[]> => {
    await requireCrypto();
    return respond(mockEarnProducts);
  },
};

export type MockApi = typeof mockApi;
