import { API_BASE_URL, USE_MOCK_API } from './config';
import { createHttpTransport } from './client';
import { mockApi } from './mock';
import type {
  AssetKind,
  BalanceSummary,
  BankCard,
  MarketAsset,
  Mover,
  MoverDirection,
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
  getTransactions(params?: { cardId?: string; limit?: number }): Promise<Transaction[]>;
  getMarkets(params?: { kind?: AssetKind }): Promise<MarketAsset[]>;
  getMovers(direction: MoverDirection): Promise<Mover[]>;
  getPortfolio(): Promise<Portfolio>;
};

function createHttpApi(baseUrl: string): FlexApi {
  const transport = createHttpTransport(baseUrl);

  return {
    getUser: () => transport.get<User>('/me'),
    getBalance: () => transport.get<BalanceSummary>('/balance'),
    getPromo: () => transport.get<PromoOffer>('/promo'),
    getCards: () => transport.get<BankCard[]>('/cards'),
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
  };
}

export const api: FlexApi = USE_MOCK_API ? mockApi : createHttpApi(API_BASE_URL);
