import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';
import { useAccessibilityFlags } from '@/ui';

type PinDotsProps = {
  length: number;
  filled: number;
  /** увеличивается при ошибке — точки «трясутся» */
  errorKey: number;
};

const DOT = 14;

/** индикатор введённых цифр PIN */
export function PinDots({ length, filled, errorKey }: PinDotsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const offset = useSharedValue(0);

  useEffect(() => {
    if (errorKey === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (reduceMotion) return;
    offset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 80 }), 3, true),
      withTiming(0, { duration: 50 }),
    );
  }, [errorKey, reduceMotion, offset]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={t('auth.pin.entered', { count: filled, total: length })}
      style={[{ flexDirection: 'row', gap: theme.spacing.lg }, style]}
    >
      {Array.from({ length }, (_, index) => (
        <View
          key={index}
          style={{
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            borderWidth: 1.5,
            borderColor: index < filled ? theme.colors.accent : theme.colors.textMuted,
            backgroundColor: index < filled ? theme.colors.accent : 'transparent',
          }}
        />
      ))}
    </Animated.View>
  );
}
