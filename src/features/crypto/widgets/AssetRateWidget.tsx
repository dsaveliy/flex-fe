import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type MarketAsset, useMarkets } from '@/api';
import { useTheme } from '@/theme';
import { AreaChart, CoinBadge, DeltaBadge, Sparkline, Text } from '@/ui';
import { formatPrice } from '@/utils/money';

import type { WidgetRenderProps } from './types';
import { WidgetCard } from './WidgetCard';

/**
 * курс избранной монеты. small — тикер, цена и мини-график; medium — цена
 * слева и широкий график справа; large — крупный график с минимумом и
 * максимумом за период
 */
export function AssetRateWidget({ widget, size, width, height }: WidgetRenderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const markets = useMarkets('crypto');
  const asset = markets.data?.find((item) => item.id === widget.params?.assetId);
  const inner = width - theme.spacing.lg * 2;

  return (
    <WidgetCard
      width={width}
      height={height}
      state={asset ? 'ready' : markets.isError ? 'error' : 'loading'}
      onRetry={() => markets.refetch()}
    >
      {asset ? (
        <View
          style={styles.fill}
          accessible
          accessibilityLabel={t('crypto.widgets.assetRate.a11y', {
            name: asset.name,
            price: formatPrice(asset.price, { currency: asset.quoteCurrency }),
          })}
        >
          {size === 'small' ? (
            <>
              <AssetTitle asset={asset} />
              <View style={styles.bottom}>
                <Price asset={asset} />
                {asset.trend.series ? (
                  <Sparkline data={asset.trend.series} width={inner} height={30} strokeWidth={1.8} />
                ) : null}
              </View>
            </>
          ) : size === 'medium' ? (
            <View style={[styles.row, styles.fill, { gap: theme.spacing.md }]}>
              <View style={styles.fill}>
                <AssetTitle asset={asset} />
                <View style={styles.bottom}>
                  <Price asset={asset} />
                </View>
              </View>
              {asset.trend.series ? (
                <AreaChart
                  data={asset.trend.series}
                  width={inner * 0.55}
                  height={height - theme.spacing.lg * 2}
                />
              ) : null}
            </View>
          ) : (
            <LargeRate asset={asset} width={inner} />
          )}
        </View>
      ) : null}
    </WidgetCard>
  );
}

function AssetTitle({ asset }: { asset: MarketAsset }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { gap: theme.spacing.sm }]}>
      <CoinBadge symbol={asset.symbol} color={asset.badgeColor} size={30} />
      <View style={styles.shrink}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {asset.symbol}
        </Text>
        <Text variant="micro" color="textMuted" numberOfLines={1}>
          {asset.name}
        </Text>
      </View>
    </View>
  );
}

function Price({ asset }: { asset: MarketAsset }) {
  const theme = useTheme();
  return (
    <>
      <Text variant="sectionTitle" numberOfLines={1} adjustsFontSizeToFit>
        {formatPrice(asset.price, { currency: asset.quoteCurrency })}
      </Text>
      <DeltaBadge
        value={asset.trend.changePercent}
        variant="caption"
        style={{ marginTop: theme.spacing.xxs }}
      />
    </>
  );
}

/** график в ряду — относительные значения; переводим их в цены, привязав последнюю точку к текущей цене */
function seriesRange(asset: MarketAsset) {
  const series = asset.trend.series ?? [];
  const last = series.at(-1) ?? 1;
  const toPrice = (value: number) => (value / last) * asset.price;
  return {
    min: toPrice(Math.min(...series)),
    max: toPrice(Math.max(...series)),
  };
}

function LargeRate({ asset, width }: { asset: MarketAsset; width: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const range = seriesRange(asset);
  const format = (value: number) => formatPrice(value, { currency: asset.quoteCurrency });

  return (
    <View style={styles.fill}>
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <View style={styles.fill}>
          <AssetTitle asset={asset} />
        </View>
        <Text variant="micro" color="textMuted">
          {t('crypto.widgets.assetRate.period')}
        </Text>
      </View>

      <Text variant="title" numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: theme.spacing.md }}>
        {format(asset.price)}
      </Text>
      <DeltaBadge value={asset.trend.changePercent} variant="bodyStrong" />

      <View style={[styles.fill, { justifyContent: 'center', marginVertical: theme.spacing.sm }]}>
        {asset.trend.series ? (
          <AreaChart data={asset.trend.series} width={width} height={96} />
        ) : null}
      </View>

      <View style={[styles.row, styles.between]}>
        <View>
          <Text variant="micro" color="textMuted">
            {t('crypto.widgets.assetRate.low')}
          </Text>
          <Text variant="bodyStrong">{format(range.min)}</Text>
        </View>
        <View style={styles.end}>
          <Text variant="micro" color="textMuted">
            {t('crypto.widgets.assetRate.high')}
          </Text>
          <Text variant="bodyStrong">{format(range.max)}</Text>
        </View>
      </View>
    </View>
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
  between: {
    justifyContent: 'space-between',
  },
  end: {
    alignItems: 'flex-end',
  },
  shrink: {
    flexShrink: 1,
  },
  bottom: {
    marginTop: 'auto',
  },
});
