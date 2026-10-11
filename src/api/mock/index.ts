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
import {
  mockBalance,
  mockCardDetails,
  mockCards,
  mockGainers,
  mockLosers,
  mockPortfolio,
  mockPromo,
  mockRates,
  mockTransactions,
  mockUser,
} from './fixtures';
import {
  defaultCryptoLayout,
  mockEarnProducts,
  mockFearGreed,
  mockNews,
} from './crypto.fixtures';
import { mockMarkets } from './markets.fixtures';

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
  getUser: (): Promise<User> => respond(mockUser),

  getBalance: (): Promise<BalanceSummary> => respond(mockBalance),

  getPromo: (): Promise<PromoOffer> => respond(mockPromo),

  getCards: (): Promise<BankCard[]> => respond(mockCards),

  getCardDetails: async (cardId: string): Promise<BankCardDetails> => {
    const details = mockCardDetails.find((item) => item.cardId === cardId);
    if (!details) {
      throw new ApiError({ status: 404, code: 'card_not_found', message: 'Card not found' });
    }
    return respond(details);
  },

  getTransactions: (params?: { cardId?: string; limit?: number }): Promise<Transaction[]> => {
    const filtered = params?.cardId
      ? mockTransactions.filter((item) => item.cardId === params.cardId)
      : mockTransactions;
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

  getPortfolio: (): Promise<Portfolio> => respond(mockPortfolio),

  getRates: (): Promise<ExchangeRates> => respond(mockRates),

  getCryptoLayout: (): Promise<CryptoLayout> => respond(cryptoLayout),

  saveCryptoLayout: (widgets: CryptoLayout['widgets']): Promise<CryptoLayout> => {
    cryptoLayout = { widgets, updatedAt: new Date().toISOString() };
    return respond(cryptoLayout);
  },

  getNews: (params?: { limit?: number }): Promise<NewsItem[]> =>
    respond(params?.limit ? mockNews.slice(0, params.limit) : mockNews),

  getFearGreed: (): Promise<FearGreedIndex> => respond(mockFearGreed),

  getEarnProducts: (): Promise<EarnProduct[]> => respond(mockEarnProducts),
};

export type MockApi = typeof mockApi;
