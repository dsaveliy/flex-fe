import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass, isNativeGlassAvailable } from './Glass';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';
import { Touchable } from './Pressable';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

/**
 * стеклянный чип категории (карточка Markets, выбор языка). выбранный
 * подсвечен мятным оттенком и зелёным текстом. на iOS 26 нативное стекло
 * реагирует на касание, поэтому JS-сжатие отключается.
 */
export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const theme = useTheme();
  const { reduceTransparency } = useAccessibilityFlags();
  const nativeGlass = isNativeGlassAvailable && !reduceTransparency;

  const content = (
    <Glass
      variant="clear"
      interactive={Boolean(onPress)}
      tint={selected ? theme.colors.accentMuted : undefined}
      radius={theme.radii.pill}
      elevated={false}
      style={[{ minHeight: 32 }, style]}
    >
      <View style={[styles.chip, { paddingHorizontal: theme.spacing.lg }]}>
        <Text variant="bodyStrong" color={selected ? 'accent' : 'textMuted'}>
          {label}
        </Text>
      </View>
    </Glass>
  );

  if (!onPress) return content;

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      pressedScale={nativeGlass ? 1 : 0.96}
    >
      {content}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
