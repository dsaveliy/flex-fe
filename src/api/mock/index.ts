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
} from '../types';
import { respond } from './delay';
import {
  mockBalance,
  mockCards,
  mockGainers,
  mockLosers,
  mockPortfolio,
  mockPromo,
  mockTransactions,
  mockUser,
} from './fixtures';
import { mockMarkets } from './markets.fixtures';

/**
 * Mock implementation of the future FastAPI endpoints.
 * Signatures mirror the planned REST routes so `services.ts` can swap the
 * implementation without touching feature code.
 */
export const mockApi = {
  getUser: (): Promise<User> => respond(mockUser),

  getBalance: (): Promise<BalanceSummary> => respond(mockBalance),

  getPromo: (): Promise<PromoOffer> => respond(mockPromo),

  getCards: (): Promise<BankCard[]> => respond(mockCards),

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
};

export type MockApi = typeof mockApi;
