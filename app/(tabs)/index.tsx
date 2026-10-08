import { useIsFocused, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBalance, useTransactions, useUser } from '@/api';
import { BalanceChartWidget } from '@/features/home/BalanceChartWidget';
import { GreetingIcon } from '@/features/home/GreetingIcon';
import { QuickActions } from '@/features/home/QuickActions';
import { useTheme } from '@/theme';
import {
  ErrorState,
  GlassCard,
  Icon,
  Screen,
  ScreenHeader,
  Skeleton,
  Text,
  Touchable,
  TransactionRow,
  useTilt,
} from '@/ui';
import { greetingSlotFor } from '@/utils/format';

/**
 * главный экран (минимализм): крупный баланс с живым графиком на весь
 * первый экран, под ним быстрые действия, промо и последние операции.
 * фоновая Σ за суммой смещается при наклоне телефона (параллакс).
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const balance = useBalance();
  const user = useUser();
  const transactions = useTransactions({ limit: 3 });
  const { parallaxStyle } = useTilt({ maxShift: 18, enabled: useIsFocused() });

  const greetingSlot = greetingSlotFor();

  return (
    <Screen
      onRefresh={() => {
        void balance.refetch();
        void user.refetch();
        void transactions.refetch();
      }}
      refreshing={balance.isRefetching}
    >
      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xxl }}>
        <ScreenHeader
          size="large"
          eyebrow={t(`greeting.${greetingSlot}`)}
          title={user.data?.firstName ?? ''}
          titleAccessory={user.data ? <GreetingIcon slot={greetingSlot} /> : null}
        />

        <View style={{ marginTop: -theme.spacing.md }}>
          {balance.isPending ? (
            <View style={{ gap: theme.spacing.md }}>
              <Skeleton height={14} width={120} />
              <Skeleton height={60} width={260} />
              <Skeleton height={220} radius={theme.radii.cardLg} />
            </View>
          ) : balance.isError ? (
            <ErrorState onRetry={() => balance.refetch()} />
          ) : (
            <BalanceChartWidget balance={balance.data} decorStyle={parallaxStyle} />
          )}
        </View>

        <QuickActions />

        <GlassCard radius={theme.radii.bannerSm}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Icon name="crypto" color={theme.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{t('home.promo.title')}</Text>
              <Text variant="caption" color="textMuted">
                {t('home.promo.subtitle')}
              </Text>
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textMuted} />
          </View>
        </GlassCard>

        <GlassCard
          title={t('home.recent')}
          headerRight={
            <Touchable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/cards')}>
              <Text variant="bodyStrong" color="accent">
                {`${t('common.seeAll')} ›`}
              </Text>
            </Touchable>
          }
        >
          {transactions.isPending ? (
            <Skeleton height={60} />
          ) : transactions.isError ? (
            <ErrorState onRetry={() => transactions.refetch()} />
          ) : (
            transactions.data.map((tx, index) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                showDivider={index < transactions.data.length - 1}
              />
            ))
          )}
        </GlassCard>
      </View>
    </Screen>
  );
}
