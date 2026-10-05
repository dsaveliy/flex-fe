import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { formatPercentAbs, trendOf } from '@/utils/format';

import { Text } from './Text';
import type { TypographyToken } from '@/theme';

export type DeltaBadgeProps = {
  /** изменение в процентах, например `-0.87` */
  value: number;
  /** необязательный суффикс вроде "vs last month" / "today" */
  caption?: string;
  variant?: TypographyToken;
  style?: ViewStyle;
};

/** `▲ +2.4% vs last month` — единообразный индикатор тренда */
export function DeltaBadge({ value, caption, variant = 'bodyStrong', style }: DeltaBadgeProps) {
  const theme = useTheme();
  const trend = trendOf(value);
  const color = trend === 'down' ? 'negative' : 'positive';
  const glyph = trend === 'down' ? '▼' : '▲';

  return (
    <View style={[styles.row, { gap: theme.spacing.xs }, style]}>
      <Text variant={variant} color={color}>
        {`${glyph} ${formatPercentAbs(value)}`}
      </Text>
      {caption ? (
        <Text variant={variant} color="textMuted">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
