import { StyleSheet, View } from 'react-native';

import type { PortfolioHolding } from '@/api';
import { useTheme } from '@/theme';
import { Text } from '@/ui';
import { formatPercent } from '@/utils/format';

export type AllocationBarProps = {
  holdings: PortfolioHolding[];
  /** легенда в одну строку (для виджета) вместо столбика */
  compact?: boolean;
};

/** доли активов портфеля: сегментированная полоса и легенда с процентами */
export function AllocationBar({ holdings, compact = false }: AllocationBarProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={[styles.bar, { gap: 2, borderRadius: theme.radii.pill }]}>
        {holdings.map((holding) => (
          <View
            key={holding.assetId}
            style={{ flex: holding.weight, backgroundColor: holding.badgeColor }}
          />
        ))}
      </View>
      <View
        style={
          compact
            ? [styles.legendRow, { gap: theme.spacing.md }]
            : { gap: theme.spacing.sm }
        }
      >
        {holdings.map((holding) => (
          <View key={holding.assetId} style={[styles.legendItem, { gap: theme.spacing.xs }]}>
            <View style={[styles.dot, { backgroundColor: holding.badgeColor }]} />
            <Text variant={compact ? 'micro' : 'bodyStrong'} style={compact ? undefined : styles.fill}>
              {holding.symbol}
            </Text>
            <Text variant={compact ? 'micro' : 'body'} color="textMuted">
              {formatPercent(holding.weight * 100, { withSign: false, digits: 0 })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 8,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fill: {
    flex: 1,
  },
});
