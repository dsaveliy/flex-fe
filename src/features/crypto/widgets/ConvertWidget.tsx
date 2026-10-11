import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useMarkets } from '@/api';
import { useTheme } from '@/theme';
import { CoinBadge, Icon, Text } from '@/ui';
import { formatCoinAmount, pairRate } from '../convertRate';
import type { WidgetRenderProps } from './types';
import { WidgetCard } from './WidgetCard';

/** быстрый обмен: пара монет и текущий курс; тап открывает раздел Convert */
export function ConvertWidget({ widget, width, height }: WidgetRenderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const markets = useMarkets('crypto');
  const from = markets.data?.find((item) => item.id === (widget.params?.from ?? 'btc'));
  const to = markets.data?.find((item) => item.id === (widget.params?.to ?? 'usdt'));
  const badge = 34;

  return (
    <WidgetCard
      width={width}
      height={height}
      icon="swap"
      title={t('crypto.widgets.convert.name')}
      state={from && to ? 'ready' : markets.isError ? 'error' : 'loading'}
      onRetry={() => markets.refetch()}
    >
      {from && to ? (
        <View style={styles.fill}>
          {/* значки пары внахлёст, как в обменниках */}
          <View style={styles.row}>
            <CoinBadge symbol={from.symbol} color={from.badgeColor} size={badge} />
            <CoinBadge
              symbol={to.symbol}
              color={to.badgeColor}
              size={badge}
              style={{
                marginLeft: -badge / 3,
                borderWidth: 2,
                borderColor: theme.colors.glassSelected,
              }}
            />
          </View>
          <View style={styles.bottom}>
            <Text variant="sectionTitle" numberOfLines={1}>
              {from.symbol} → {to.symbol}
            </Text>
            <Text variant="micro" color="textMuted" numberOfLines={1} adjustsFontSizeToFit>
              1 {from.symbol} ≈ {formatCoinAmount(pairRate(from, to))} {to.symbol}
            </Text>
            <View
              style={[
                styles.row,
                styles.cta,
                {
                  marginTop: theme.spacing.sm,
                  gap: theme.spacing.xs,
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.accent,
                  paddingVertical: theme.spacing.xs + 2,
                },
              ]}
            >
              <Icon name="swap" size={14} color={theme.colors.textInverse} strokeWidth={2.2} />
              <Text variant="bodyStrong" color="textInverse">
                {t('crypto.widgets.convert.action')}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cta: {
    justifyContent: 'center',
  },
  bottom: {
    marginTop: 'auto',
  },
});
