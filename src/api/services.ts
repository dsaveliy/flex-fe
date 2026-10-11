import { API_BASE_URL, USE_MOCK_API } from './config';
import { createHttpTransport } from './client';
import { mockApi } from './mock';
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
} from './types';

/** контракт, общий для mock- и настоящей реализации бэкенда */
export type FlexApi = {
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
};

function createHttpApi(baseUrl: string): FlexApi {
  const transport = createHttpTransport(baseUrl);

  return {
    getUser: () => transport.get<User>('/me'),
    getBalance: () => transport.get<BalanceSummary>('/balance'),
    getPromo: () => transport.get<PromoOffer>('/promo'),
    getCards: () => transport.get<BankCard[]>('/cards'),
    getCardDetails: (cardId) =>
      transport.get<BankCardDetails>(`/cards/${encodeURIComponent(cardId)}/details`),
    getTransactions: (params) => {
      const query = new URLSearchParams();
      if (params?.cardId) query.set('card_id', params.cardId);
      if (params?.limit) query.set('limit', String(params.limit));
      const suffix = query.size > 0 ? `?${query.toString()}` : '';
      return transport.get<Transaction[]>(`/transactions${suffix}`);
    },
    getMarkets: (params) =>
      transport.get<MarketAsset[]>(params?.kind ? `/markets?kind=${params.kind}` : '/markets'),
    getMovers: (direction) => transport.get<Mover[]>(`/markets/movers?direction=${direction}`),
    getPortfolio: () => transport.get<Portfolio>('/portfolio'),
    getRates: () => transport.get<ExchangeRates>('/exchange-rates'),
    getCryptoLayout: () => transport.get<CryptoLayout>('/me/crypto-layout'),
    saveCryptoLayout: (widgets) => transport.put<CryptoLayout>('/me/crypto-layout', { widgets }),
    getNews: (params) =>
      transport.get<NewsItem[]>(params?.limit ? `/news?limit=${params.limit}` : '/news'),
    getFearGreed: () => transport.get<FearGreedIndex>('/markets/fear-greed'),
    getEarnProducts: () => transport.get<EarnProduct[]>('/earn/products'),
  };
}

export const api: FlexApi = USE_MOCK_API ? mockApi : createHttpApi(API_BASE_URL);
