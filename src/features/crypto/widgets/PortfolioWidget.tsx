import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { usePortfolio } from '@/api';
import { useTheme } from '@/theme';
import { AreaChart, DeltaBadge, PrivateAmount, Text } from '@/ui';
import { formatMoney } from '@/utils/money';

import { AllocationBar } from '../AllocationBar';
import type { WidgetRenderProps } from './types';
import { WidgetCard } from './WidgetCard';

/** стоимость криптопортфеля и изменение за день; large показывает ещё доли активов */
export function PortfolioWidget({ size, width, height }: WidgetRenderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const portfolio = usePortfolio();
  const inner = width - theme.spacing.lg * 2;
  const data = portfolio.data;

  return (
    <WidgetCard
      width={width}
      height={height}
      icon="pie"
      title={t('crypto.widgets.portfolio.name')}
      state={data ? 'ready' : portfolio.isError ? 'error' : 'loading'}
      onRetry={() => portfolio.refetch()}
    >
      {data ? (
        size === 'medium' ? (
          <View style={[styles.row, styles.fill, { gap: theme.spacing.md }]}>
            <View style={[styles.fill, styles.bottom]}>
              <PrivateAmount maskVariant="title">
                <Text variant="title" numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(data.value)}
                </Text>
              </PrivateAmount>
              <DeltaBadge value={data.dayChangePercent} caption={t('crypto.today')} variant="caption" />
            </View>
            <AreaChart data={data.series} width={inner * 0.45} height={64} />
          </View>
        ) : (
          <View style={[styles.fill, { gap: theme.spacing.md }]}>
            <View>
              <PrivateAmount maskVariant="title">
                <Text variant="title" numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(data.value)}
                </Text>
              </PrivateAmount>
              <DeltaBadge value={data.dayChangePercent} caption={t('crypto.today')} variant="caption" />
            </View>
            <AreaChart data={data.series} width={inner} height={90} />
            <AllocationBar holdings={data.holdings} compact />
          </View>
        )
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
    alignItems: 'flex-end',
  },
  bottom: {
    justifyContent: 'flex-end',
  },
});
