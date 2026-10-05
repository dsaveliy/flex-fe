import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBalance } from '@/api';
import { useTheme } from '@/theme';
import {
  ActionCircle,
  DeltaBadge,
  ErrorState,
  GlassCard,
  Icon,
  Screen,
  Skeleton,
  Text,
} from '@/ui';
import { greetingSlotFor } from '@/utils/format';
import { splitMoneyParts } from '@/utils/money';

/**
 * главный экран — временная раскладка, подключённая к настоящей
 * дизайн-системе и mock API. итоговая попиксельная вёрстка будет сделана
 * после появления макетов; сейчас она сквозным образом проверяет
 * примитив Glass, фон Screen и слой данных.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const balance = useBalance();

  const greetingKey = `greeting.${greetingSlotFor()}` as const;

  return (
    <Screen>
      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View>
          <Text variant="body" color="textMuted">
            {t(greetingKey)}
          </Text>
          <Text variant="title">Alex ☀</Text>
        </View>

        <GlassCard>
          <Text variant="label" color="textMuted">
            {t('home.totalBalance').toUpperCase()}
          </Text>

          {balance.isPending ? (
            <Skeleton height={40} width={160} style={{ marginTop: theme.spacing.sm }} />
          ) : balance.isError ? (
            <ErrorState onRetry={() => balance.refetch()} />
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: theme.spacing.xs,
                  marginTop: theme.spacing.xs,
                }}
              >
                <Text variant="display">
                  {splitMoneyParts(balance.data.total).integer}
                </Text>
                <Text variant="balanceCents" color="textPrimary" style={{ opacity: 0.6 }}>
                  .{splitMoneyParts(balance.data.total).fraction}
                </Text>
                <Text variant="balanceCurrency" color="textMuted">
                  {balance.data.total.currency}
                </Text>
              </View>

              <DeltaBadge
                value={balance.data.monthChangePercent}
                caption={t('home.deltaVsLastMonth')}
                style={{ marginTop: theme.spacing.sm }}
              />
            </>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: theme.spacing.xxl,
            }}
          >
            <ActionCircle icon="transfer" label={t('home.actions.transfer')} />
            <ActionCircle icon="plus" label={t('home.actions.topUp')} accent />
            <ActionCircle icon="bitcoin" label={t('home.actions.buyCrypto')} />
          </View>
        </GlassCard>

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
      </View>
    </Screen>
  );
}
