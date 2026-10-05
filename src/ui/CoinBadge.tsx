import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export type CoinBadgeProps = {
  symbol: string;
  color: string;
  size?: number;
  style?: ViewStyle;
};

/** цветной круг с первой буквой актива — используется на экранах крипто */
export function CoinBadge({ symbol, color, size, style }: CoinBadgeProps) {
  const theme = useTheme();
  const diameter = size ?? theme.sizes.coinBadge;

  return (
    <View
      style={[
        styles.badge,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text
        variant="sectionTitle"
        color="textInverse"
        style={{ fontSize: diameter * 0.36, lineHeight: diameter * 0.44 }}
      >
        {symbol.charAt(0)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
