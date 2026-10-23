import { randomUUID } from 'expo-crypto';
import { useCallback, useState } from 'react';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import { queryKeys } from './queryKeys';
import { api } from './api';
import type {
  AssetKind,
  BalanceSummary,
  BankCard,
  BankCardDetails,
  CryptoLayout,
  CryptoWidget,
  EarnProduct,
  EarnSubscribeRequest,
  ExchangeRequest,
  FearGreedIndex,
  ExchangeRates,
  IssueCardRequest,
  LinkCardRequest,
  LinkedCard,
  MarketAsset,
  Mover,
  MoverDirection,
  NewsItem,
  Portfolio,
  PaymentRequest,
  PromoOffer,
  TopUpRequest,
  Transaction,
  TransferRequest,
  User,
  WithdrawalRequest,
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

/* ---------- операции с виртуальными деньгами ---------- */

/**
 * ключ идемпотентности на одну попытку операции: двойной тап или повтор после
 * обрыва сети не проведут её дважды. после успеха — новый ключ для следующей
 */
export function useIdempotencyKey(): [string, () => void] {
  const [key, setKey] = useState(() => randomUUID());
  const renew = useCallback(() => setKey(randomUUID()), []);
  return [key, renew];
}

/** после движения денег устаревают баланс, карты, ленты операций и портфель */
function useRefreshMoney() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    for (const queryKey of [
      queryKeys.balance,
      queryKeys.cards,
      ['transactions'],
      queryKeys.portfolio,
    ]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient]);
}

export function useLinkedCards(): UseQueryResult<LinkedCard[]> {
  return useQuery({ queryKey: queryKeys.linkedCards, queryFn: () => api.getLinkedCards() });
}

export function useLinkCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LinkCardRequest) => api.linkCard(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.linkedCards }),
  });
}

export function useIssueCard() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: (body: IssueCardRequest) => api.issueCard(body),
    onSuccess: refresh,
  });
}

/** заморозка: кэш карт меняется сразу, при ошибке — откат */
export function useSetCardFrozen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, frozen }: { cardId: string; frozen: boolean }) =>
      api.setCardFrozen(cardId, frozen),
    onMutate: async ({ cardId, frozen }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cards });
      const previous = queryClient.getQueryData<BankCard[]>(queryKeys.cards);
      queryClient.setQueryData<BankCard[]>(queryKeys.cards, (cards) =>
        cards?.map((card) =>
          card.id === cardId ? { ...card, status: frozen ? 'frozen' : 'active' } : card,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cards, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.cards }),
  });
}

export function useOpenAccount() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: (currency: string) => api.openAccount(currency),
    onSuccess: refresh,
  });
}

export function useTopUp() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: ({ body, key }: { body: TopUpRequest; key: string }) => api.topUp(body, key),
    onSuccess: refresh,
  });
}

export function useWithdraw() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: ({ body, key }: { body: WithdrawalRequest; key: string }) =>
      api.withdraw(body, key),
    onSuccess: refresh,
  });
}

export function usePay() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: ({ body, key }: { body: PaymentRequest; key: string }) => api.pay(body, key),
    onSuccess: refresh,
  });
}

export function useTransfer() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: ({ body, key }: { body: TransferRequest; key: string }) => api.transfer(body, key),
    onSuccess: refresh,
  });
}

/**
 * обмен между своими счетами. если у клиента нет счёта в валюте `toCurrency`,
 * он сначала открывается (`POST /accounts`). с криптой — `/convert` по crypto-токену
 */
export function useExchange() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: async ({
      body,
      toCurrency,
      key,
      crypto,
    }: {
      body: Omit<ExchangeRequest, 'toAccountId'> & { toAccountId?: string };
      toCurrency: string;
      key: string;
      crypto: boolean;
    }) => {
      const toAccountId = body.toAccountId ?? (await api.openAccount(toCurrency)).id;
      const request = { ...body, toAccountId };
      return crypto ? api.convert(request, key) : api.exchange(request, key);
    },
    onSuccess: refresh,
  });
}

export function useSubscribeEarn() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: (body: EarnSubscribeRequest) => api.subscribeEarn(body),
    onSuccess: refresh,
  });
}
