import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import { queryKeys } from './queryKeys';
import { api } from './services';
import type {
  AssetKind,
  BalanceSummary,
  BankCard,
  BankCardDetails,
  CryptoLayout,
  CryptoWidget,
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

/** реквизиты карты; запрашиваются только когда `enabled` (пользователь их открыл) */
export function useCardDetails(
  cardId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
): UseQueryResult<BankCardDetails> {
  return useQuery({
    queryKey: queryKeys.cardDetails(cardId ?? ''),
    queryFn: () => api.getCardDetails(cardId ?? ''),
    enabled: enabled && Boolean(cardId),
    // реквизиты не держим в кэше дольше, чем нужно
    gcTime: 60_000,
  });
}

export function useTransactions(params?: {
  cardId?: string;
  limit?: number;
}): UseQueryResult<Transaction[]> {
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () => api.getTransactions(params),
    // при смене карты список не мигает скелетоном, пока грузится новый
    placeholderData: keepPreviousData,
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

export function useRates(): UseQueryResult<ExchangeRates> {
  return useQuery({ queryKey: queryKeys.rates, queryFn: () => api.getRates() });
}

/** раскладка виджетов рабочего стола Crypto текущего пользователя */
export function useCryptoLayout(): UseQueryResult<CryptoLayout> {
  return useQuery({ queryKey: queryKeys.cryptoLayout, queryFn: () => api.getCryptoLayout() });
}

/**
 * сохранение раскладки. кэш обновляется сразу (оптимистично), поэтому сетка
 * и галерея виджетов видят изменения мгновенно; при ошибке откатываемся
 */
export function useSaveCryptoLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (widgets: CryptoWidget[]) => api.saveCryptoLayout(widgets),
    onMutate: async (widgets) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cryptoLayout });
      const previous = queryClient.getQueryData<CryptoLayout>(queryKeys.cryptoLayout);
      queryClient.setQueryData<CryptoLayout>(queryKeys.cryptoLayout, {
        widgets,
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _widgets, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cryptoLayout, context.previous);
    },
    onSuccess: (layout) => queryClient.setQueryData(queryKeys.cryptoLayout, layout),
  });
}

export function useNews(limit?: number): UseQueryResult<NewsItem[]> {
  return useQuery({
    queryKey: queryKeys.news(limit),
    queryFn: () => api.getNews(limit ? { limit } : undefined),
  });
}

export function useFearGreed(): UseQueryResult<FearGreedIndex> {
  return useQuery({ queryKey: queryKeys.fearGreed, queryFn: () => api.getFearGreed() });
}

export function useEarnProducts(): UseQueryResult<EarnProduct[]> {
  return useQuery({ queryKey: queryKeys.earnProducts, queryFn: () => api.getEarnProducts() });
}
