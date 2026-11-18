import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ApiError, useTransactions } from '@/api';
import { useTheme } from '@/theme';
import {
  ActionMenu,
  ErrorState,
  GlassCard,
  Icon,
  SearchField,
  Skeleton,
  Text,
  Touchable,
  TransactionRow,
  useAccessibilityFlags,
} from '@/ui';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

const PERIODS: Period[] = ['week', 'month', 'quarter', 'year', 'all'];
const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = {
  week: 7,
  month: 30,
  quarter: 91,
  year: 365,
};
/** сколько операций видно, пока список свёрнут */
const COLLAPSED_COUNT = 5;
/** размер значка-воронки фильтра периода */
const FILTER_ICON = 18;

/**
 * операции выбранной карты. справа в шапке — фильтр по периоду (системное
 * меню с галочкой) и «Все ›», раскрывающее список целиком на месте.
 */
export function CardTransactions({ cardId }: { cardId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const [period, setPeriod] = useState<Period>('all');
  const [from, setFrom] = useState<string>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const transactions = useTransactions({ cardId, from, query: query || undefined });
  const hasFilters = period !== 'all' || search.length > 0;
  const accessDenied = transactions.error instanceof ApiError && [401, 403, 404].includes(transactions.error.status);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  useEffect(() => setShowAll(false), [cardId, query, from]);

  const selectPeriod = (value: Period) => {
    setPeriod(value);
    setFrom(value === 'all' ? undefined : new Date(Date.now() - PERIOD_DAYS[value] * 86_400_000).toISOString());
  };
  const resetFilters = () => {
    selectPeriod('all');
    setSearch('');
    setQuery('');
  };
  const items = transactions.data ?? [];
  const visible = showAll ? items : items.slice(0, COLLAPSED_COUNT);
  const canExpand = search.trim() === query && items.length > COLLAPSED_COUNT;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
      {/* подпись периода живёт вне SwiftUI-меню: его контейнер подстраивает
          ширину на кадр позже, и новая подпись сначала была бы обрезана */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        {period !== 'all' ? (
          <Text variant="bodyStrong" color="accent">
            {t(`cards.periods.${period}`)}
          </Text>
        ) : null}
        <ActionMenu
          title={t('cards.periods.title')}
          cancelLabel={t('common.cancel')}
          accessibilityLabel={t('cards.a11y.filter')}
          // размер под значок: воронка стоит на одной линии с подписью периода и не прыгает
          triggerSize={{ width: FILTER_ICON, height: FILTER_ICON }}
          items={PERIODS.map((value) => ({
            id: value,
            label: t(`cards.periods.${value}`),
            checked: value === period,
            onPress: () => selectPeriod(value),
          }))}
        >
          <Icon
            name="filter"
            size={FILTER_ICON}
            color={period === 'all' ? theme.colors.textMuted : theme.colors.accent}
          />
        </ActionMenu>
      </View>
      {canExpand ? (
        <Touchable accessibilityRole="button" hitSlop={8} onPress={() => setShowAll((v) => !v)}>
          <Text variant="bodyStrong" color="accent">
            {showAll ? t('cards.actions.collapse') : `${t('common.seeAll')} ›`}
          </Text>
        </Touchable>
      ) : null}
    </View>
  );

  return (
    <GlassCard title={t('cards.transactions')} headerRight={header}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        <SearchField
          size="small"
          placeholder={t('cards.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          maxLength={80}
        />
        {hasFilters ? (
          <Touchable accessibilityRole="button" onPress={resetFilters} style={{ alignSelf: 'flex-start' }}>
            <Text color="accent">{t('cards.resetFilters')}</Text>
          </Touchable>
        ) : null}
      </View>
      {transactions.isPending || search.trim() !== query ? (
        <Skeleton height={60} />
      ) : accessDenied ? (
        <Text align="center" color="textMuted">{t('cards.transactionsAccessDenied')}</Text>
      ) : transactions.isError ? (
        <ErrorState onRetry={() => transactions.refetch()} />
      ) : items.length === 0 ? (
        <Text
          variant="body"
          color="textMuted"
          align="center"
          style={{ paddingVertical: theme.spacing.lg }}
        >
          {query ? t('cards.noMatchingTransactions') : period === 'all' ? t('cards.noTransactions') : t('cards.noTransactionsInPeriod')}
        </Text>
      ) : (
        <View>
          {/* строки монтируются заново при смене карты или раскрытии и въезжают лесенкой */}
          {visible.map((tx, index) => (
            <Animated.View
              key={tx.id}
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(Math.min(index, 8) * 35).duration(theme.durations.normal)
              }
            >
              <TransactionRow transaction={tx} showDivider={index < visible.length - 1} />
            </Animated.View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
