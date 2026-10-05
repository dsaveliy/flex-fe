import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from './queryKeys';
import { api } from './services';
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

export function useUser(): UseQueryResult<User> {
  return useQuery({ queryKey: queryKeys.user, queryFn: () => api.getUser() });
}

export function useBalance(): UseQueryResult<BalanceSummary> {
  return useQuery({ queryKey: queryKeys.balance, queryFn: () => api.getBalance() });
}

export function usePromo(): UseQueryResult<PromoOffer> {
  return useQuery({ queryKey: queryKeys.promo, queryFn: () => api.getPromo() });
}

export function useCards(): UseQueryResult<BankCard[]> {
  return useQuery({ queryKey: queryKeys.cards, queryFn: () => api.getCards() });
}

export function useTransactions(params?: {
  cardId?: string;
  limit?: number;
}): UseQueryResult<Transaction[]> {
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () => api.getTransactions(params),
  });
}

export function useMarkets(kind?: AssetKind): UseQueryResult<MarketAsset[]> {
  return useQuery({
    queryKey: queryKeys.markets(kind),
    queryFn: () => api.getMarkets(kind ? { kind } : undefined),
  });
}

export function useMovers(direction: MoverDirection): UseQueryResult<Mover[]> {
  return useQuery({
    queryKey: queryKeys.movers(direction),
    queryFn: () => api.getMovers(direction),
  });
}

export function usePortfolio(): UseQueryResult<Portfolio> {
  return useQuery({ queryKey: queryKeys.portfolio, queryFn: () => api.getPortfolio() });
}
