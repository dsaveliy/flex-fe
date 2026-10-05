import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import type { GlassProps } from './Glass.types';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';

const CLEAR = 'rgba(255, 255, 255, 0)';

/**
 * кроссплатформенная имитация Liquid Glass, используемая, когда нативный
 * эффект недоступен (iOS < 26, Android, web, Reduce Transparency).
 *
 * слои снизу вверх:
 *   1. заливка с низкой прозрачностью — пропускает насыщенные цвета страницы
 *   2. размытие фона (+насыщенность) — матовый вид
 *   3. диагональный зеркальный блик — свет, падающий на верхний левый угол панели
 *   4. тень глубины снизу — придаёт панели толщину
 *   5. освещённая и затенённая кромка (border) — яркая сверху и слева, слабая снизу и справа
 *
 * внешний view несёт тень и НЕ обрезается (на iOS `overflow: hidden`
 * обрезал бы тень); декоративные слои находятся во внутреннем обрезанном view.
 */
export function GlassFallback({
  variant = 'regular',
  tint,
  radius,
  elevated = true,
  style,
  children,
  testID,
  ...viewProps
}: GlassProps) {
  const theme = useTheme();
  const { reduceTransparency } = useAccessibilityFlags();

  const cornerRadius = radius ?? theme.radii.card;
  const isClear = variant === 'clear';
  const fill = isClear ? theme.colors.glassFill : theme.colors.glassFillStrong;

  const surfaceStyle = [
    styles.surface,
    {
      borderRadius: cornerRadius,
      borderTopColor: theme.colors.glassBorder,
      borderLeftColor: theme.colors.glassBorder,
      borderBottomColor: theme.colors.glassEdgeLow,
      borderRightColor: theme.colors.glassEdgeLow,
    },
    elevated ? theme.shadows.card : null,
    style,
  ];

  if (reduceTransparency) {
    return (
      <View
        {...viewProps}
        testID={testID}
        style={[
          surfaceStyle,
          styles.opaque,
          { backgroundColor: theme.isDark ? '#16211D' : '#FFFFFF' },
        ]}
      >
        {children}
      </View>
    );
  }

  // у тона 'light' в expo-blur на web рисуется почти белая плита, скрывающая
  // фон; нейтральный тон 'default' оставляет цвета видимыми.
  const blurTint = theme.isDark ? 'dark' : Platform.OS === 'web' ? 'default' : 'light';

  return (
    <View
      {...viewProps}
      testID={testID}
      style={[surfaceStyle, { backgroundColor: tint ?? fill }]}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: cornerRadius }]}
      >
        <BlurView
          intensity={isClear ? theme.blurIntensity * 0.7 : theme.blurIntensity}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[theme.colors.glassHighlight, CLEAR, CLEAR]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[CLEAR, theme.colors.glassShade]}
          locations={[0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderWidth: 1,
  },
  opaque: {
    overflow: 'hidden',
  },
  clip: {
    overflow: 'hidden',
  },
});
