import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useBalancePrivacy } from '@/providers/BalancePrivacyProvider';
import { type ThemeColors, type TypographyToken, useTheme } from '@/theme';

import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';

export type PrivateAmountProps = {
  children: ReactNode;
  /** типографика скрываемой суммы — по ней считается размер точек */
  maskVariant?: TypographyToken;
  maskColor?: keyof ThemeColors;
  /** тап по сумме переключает режим скрытия */
  toggleOnPress?: boolean;
  style?: ViewStyle;
};

/** диаметр точки и зазор между точками в долях кегля */
const DOT_SIZE = 0.2;
const DOT_GAP = 0.16;

/**
 * обёртка для любой суммы: в режиме «скрыть баланс» содержимое плавно
 * гаснет и сжимается, а на его месте проявляются точки. раскладка не
 * меняется — исходный текст остаётся в дереве с нулевой прозрачностью.
 * точки заполняют ровно ширину скрытой суммы: их число считается по
 * её размеру, поэтому и короткие (`0.1461`), и длинные (`12 480.50`)
 * суммы закрываются аккуратно, без обрезки и пустот.
 */
export function PrivateAmount({
  children,
  maskVariant = 'display',
  maskColor = 'textPrimary',
  toggleOnPress = false,
  style,
}: PrivateAmountProps) {
  const theme = useTheme();
  const { hidden, toggle } = useBalancePrivacy();
  const { reduceMotion } = useAccessibilityFlags();
  const progress = useSharedValue(hidden ? 1 : 0);
  const [width, setWidth] = useState(0);

  const fontSize = theme.typography[maskVariant].fontSize ?? 14;
  const dot = Math.max(3, Math.round(fontSize * DOT_SIZE));
  const gap = fontSize * DOT_GAP;
  const dotCount = Math.max(3, Math.floor(width / (dot + gap)));

  useEffect(() => {
    const target = hidden ? 1 : 0;
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: theme.durations.slow });
  }, [hidden, progress, reduceMotion, theme.durations.slow]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 1 - progress.value * 0.06 }],
  }));
  const maskStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  const body = (
    <View style={style} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Animated.View
        style={contentStyle}
        importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </Animated.View>
      {/* у цифр есть боковые поля глифа, у точек нет — отступ справа, чтобы
          последняя точка не прилипала к валюте */}
      <Animated.View pointerEvents="none" style={[styles.mask, { paddingRight: gap }, maskStyle]}>
        {width > 0
          ? Array.from({ length: dotCount }, (_, index) => (
              <View
                key={index}
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  backgroundColor: theme.colors[maskColor],
                }}
              />
            ))
          : null}
      </Animated.View>
    </View>
  );

  if (!toggleOnPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggle();
      }}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
});
