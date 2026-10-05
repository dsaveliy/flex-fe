import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Touchable } from './Pressable';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

/** Category chip: mint fill + green text when selected (Markets card). */
export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.chip,
        {
          paddingHorizontal: theme.spacing.lg,
          minHeight: 32,
          borderRadius: theme.radii.pill,
          backgroundColor: selected ? theme.colors.accentMuted : 'transparent',
          borderColor: selected ? 'transparent' : theme.colors.divider,
        },
        style,
      ]}
    >
      <Text variant="bodyStrong" color={selected ? 'accent' : 'textMuted'}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      pressedScale={0.96}
    >
      {content}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
