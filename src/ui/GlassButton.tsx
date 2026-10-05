import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Icon, type IconName } from './icons/Icon';
import { Touchable } from './Pressable';
import { Text } from './Text';

export type GlassButtonProps = {
  label?: string;
  icon?: IconName;
  onPress?: () => void;
  /**
   * `pill`  — horizontal capsule with icon + label (Cards actions);
   * `circle` — round action button (Home quick actions, header buttons).
   */
  shape?: 'pill' | 'circle';
  /** Solid accent fill instead of glass (green "+" button). */
  accent?: boolean;
  size?: number;
  accessibilityLabel?: string;
  style?: ViewStyle;
  testID?: string;
};

/** Interactive glass button; uses native Liquid Glass touch reaction on iOS 26+. */
export function GlassButton({
  label,
  icon,
  onPress,
  shape = 'pill',
  accent = false,
  size,
  accessibilityLabel,
  style,
  testID,
}: GlassButtonProps) {
  const theme = useTheme();
  const diameter = size ?? theme.sizes.actionCircle;
  const iconColor = accent ? theme.colors.textInverse : theme.colors.textPrimary;

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      testID={testID}
      style={style}
    >
      <Glass
        variant="regular"
        interactive
        tint={accent ? theme.colors.accent : undefined}
        radius={theme.radii.pill}
        style={
          shape === 'circle'
            ? { width: diameter, height: diameter }
            : { minHeight: theme.sizes.touchTarget }
        }
      >
        <View
          style={[
            styles.content,
            shape === 'circle'
              ? styles.circleContent
              : { paddingHorizontal: theme.spacing.xl, gap: theme.spacing.sm },
          ]}
        >
          {icon ? <Icon name={icon} size={shape === 'circle' ? 22 : 18} color={iconColor} /> : null}
          {label && shape === 'pill' ? (
            <Text variant="bodyStrong" color={accent ? 'textInverse' : 'textPrimary'}>
              {label}
            </Text>
          ) : null}
        </View>
      </Glass>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    width: '100%',
    height: '100%',
  },
});
