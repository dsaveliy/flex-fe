import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTransactions } from '@/api';
import { useTheme } from '@/theme';
import {
  ActionMenu,
  ErrorState,
  GlassCard,
  Icon,
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

/**
 * операции выбранной карты. справа в шапке — фильтр по периоду (системное
 * меню с галочкой) и «Все ›», раскрывающее список целиком на месте.
 */
export function CardTransactions({ cardId }: { cardId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const transactions = useTransactions({ cardId });
  const [period, setPeriod] = useState<Period>('all');
  const [showAll, setShowAll] = useState(false);

  // у другой карты список снова свёрнут, выбранный период сохраняется
  useEffect(() => setShowAll(false), [cardId]);

  const cutoff = period === 'all' ? 0 : Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;
  const filtered = (transactions.data ?? []).filter(
    (tx) => new Date(tx.occurredAt).getTime() >= cutoff,
  );
  const visible = showAll ? filtered : filtered.slice(0, COLLAPSED_COUNT);
  const canExpand = filtered.length > COLLAPSED_COUNT;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
      <ActionMenu
        title={t('cards.periods.title')}
        cancelLabel={t('common.cancel')}
        accessibilityLabel={t('cards.a11y.filter')}
        items={PERIODS.map((value) => ({
          id: value,
          label: t(`cards.periods.${value}`),
          checked: value === period,
          onPress: () => setPeriod(value),
        }))}
      >
        {/* выбранный период подсвечен рядом с воронкой */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          {period !== 'all' ? (
            <Text variant="bodyStrong" color="accent">
              {t(`cards.periods.${period}`)}
            </Text>
          ) : null}
          <Icon
            name="filter"
            size={18}
            color={period === 'all' ? theme.colors.textMuted : theme.colors.accent}
          />
        </View>
      </ActionMenu>
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
      {transactions.isPending ? (
        <Skeleton height={60} />
      ) : transactions.isError ? (
        <ErrorState onRetry={() => transactions.refetch()} />
      ) : filtered.length === 0 ? (
        <Text
          variant="body"
          color="textMuted"
          align="center"
          style={{ paddingVertical: theme.spacing.lg }}
        >
          {period === 'all' ? t('cards.noTransactions') : t('cards.noTransactionsInPeriod')}
        </Text>
      ) : (
        <View style={{ opacity: transactions.isPlaceholderData ? 0.5 : 1 }}>
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
