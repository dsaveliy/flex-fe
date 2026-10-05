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
  /** Light haptic on press. Default: true. */
  haptic?: boolean;
  /** Scale applied while pressed; set to 1 to disable. */
  pressedScale?: number;
};

/**
 * Standard touchable of the design system: UI-thread scale animation,
 * light haptics, 44pt minimum touch target and Reduce Motion support.
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
