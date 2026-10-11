import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useMovers } from '@/api';
import { useTheme } from '@/theme';
import { CoinBadge, Text } from '@/ui';
import { formatPercentAbs } from '@/utils/format';

import type { WidgetRenderProps } from './types';
import { WidgetCard } from './WidgetCard';

/** лидеры роста или падения за сутки: medium — 4 монеты в ряд, large — список из 6 */
export function MoversWidget({ widget, size, width, height }: WidgetRenderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const direction = widget.params?.direction ?? 'gainers';
  const movers = useMovers(direction);
  const list = movers.data ?? [];

  return (
    <WidgetCard
      width={width}
      height={height}
      icon="chart"
      title={t(`crypto.widgets.movers.${direction}`)}
      state={movers.data ? 'ready' : movers.isError ? 'error' : 'loading'}
      onRetry={() => movers.refetch()}
    >
      {size === 'medium' ? (
        <View style={[styles.row, styles.fill]}>
          {list.slice(0, 4).map((mover) => (
            <View key={mover.id} style={[styles.cell, { gap: theme.spacing.xxs }]}>
              <CoinBadge symbol={mover.symbol} color={mover.badgeColor} size={34} />
              <Text variant="caption" numberOfLines={1}>
                {mover.symbol}
              </Text>
              <Text variant="micro" color={mover.changePercent >= 0 ? 'positive' : 'negative'}>
                {mover.changePercent >= 0 ? '▲' : '▼'} {formatPercentAbs(mover.changePercent)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.fill, styles.list]}>
          {list.slice(0, 6).map((mover, index) => (
            <View key={mover.id} style={[styles.listRow, { gap: theme.spacing.sm }]}>
              <Text variant="micro" color="textMuted" style={styles.rank}>
                {index + 1}
              </Text>
              <CoinBadge symbol={mover.symbol} color={mover.badgeColor} size={28} />
              <Text variant="bodyStrong" style={styles.fill} numberOfLines={1}>
                {mover.symbol}
              </Text>
              <Text
                variant="bodyStrong"
                color={mover.changePercent >= 0 ? 'positive' : 'negative'}
              >
                {mover.changePercent >= 0 ? '▲' : '▼'} {formatPercentAbs(mover.changePercent)}
              </Text>
            </View>
          ))}
        </View>
      )}
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
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  list: {
    justifyContent: 'space-between',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 12,
  },
});
