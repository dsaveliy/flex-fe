import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform, Pressable as RNPressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export type TouchableProps = PressableProps & {
  /** лёгкая вибрация при нажатии. по умолчанию: true */
  haptic?: boolean;
  /** масштаб при нажатии; значение 1 отключает эффект */
  pressedScale?: number;
};

/**
 * стандартный нажимаемый элемент дизайн-системы: анимация масштаба в UI-потоке,
 * лёгкая вибрация, минимальная зона касания 44pt и поддержка Reduce Motion.
 */
export function Touchable({
  haptic = true,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  onPress,
  style,
  hitSlop,
  children,
  ...rest
}: TouchableProps) {
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      if (!reduceMotion && pressedScale !== 1) {
        scale.value = withTiming(pressedScale, { duration: theme.durations.fast });
      }
      onPressIn?.(event);
    },
    [onPressIn, pressedScale, reduceMotion, scale, theme.durations.fast],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      scale.value = withSpring(1, theme.springs.press);
      onPressOut?.(event);
    },
    [onPressOut, scale, theme.springs.press],
  );

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (haptic && Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(event);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      {...rest}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      hitSlop={hitSlop ?? theme.spacing.sm}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
