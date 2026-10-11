import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useMarkets } from '@/api';
import { useTheme } from '@/theme';
import { CoinBadge, DeltaBadge, Sparkline, Text } from '@/ui';
import { formatPrice } from '@/utils/money';

import type { WidgetRenderProps } from './types';
import { WidgetCard } from './WidgetCard';

/** избранные монеты списком: тикер, мини-график, цена и изменение */
export function WatchlistWidget({ widget, width, height }: WidgetRenderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const markets = useMarkets();
  const ids = widget.params?.assetIds ?? [];
  const assets = ids
    .map((id) => markets.data?.find((item) => item.id === id))
    .filter((item) => item !== undefined);

  return (
    <WidgetCard
      width={width}
      height={height}
      icon="star"
      title={t('crypto.widgets.watchlist.name')}
      state={markets.data ? 'ready' : markets.isError ? 'error' : 'loading'}
      onRetry={() => markets.refetch()}
    >
      <View style={[styles.fill, styles.list]}>
        {assets.map((asset) => (
          <View key={asset.id} style={[styles.row, { gap: theme.spacing.sm }]}>
            <CoinBadge symbol={asset.symbol} color={asset.badgeColor} size={30} />
            <View style={styles.fill}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {asset.symbol}
              </Text>
              <Text variant="micro" color="textMuted" numberOfLines={1}>
                {asset.name}
              </Text>
            </View>
            {asset.trend.series ? (
              <Sparkline data={asset.trend.series} width={52} height={22} strokeWidth={1.5} />
            ) : null}
            <View style={styles.end}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {formatPrice(asset.price, { currency: asset.quoteCurrency })}
              </Text>
              <DeltaBadge value={asset.trend.changePercent} variant="micro" />
            </View>
          </View>
        ))}
      </View>
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  list: {
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  end: {
    alignItems: 'flex-end',
  },
});
