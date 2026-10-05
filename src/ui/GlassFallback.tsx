import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import type { GlassProps } from './Glass.types';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';

const CLEAR = 'rgba(255, 255, 255, 0)';

/**
 * Cross-platform imitation of Liquid Glass used when the native effect is not
 * available (iOS < 26, Android, web, Reduce Transparency).
 *
 * Layers, bottom → top:
 *   1. low-alpha fill            — lets the saturated page colors show through
 *   2. backdrop blur (+saturate) — frosted look
 *   3. diagonal specular sheen   — light catching the top-left of the pane
 *   4. bottom depth shade        — gives the pane thickness
 *   5. lit/shaded rim (border)   — bright top/left edge, faint bottom/right
 *
 * The outer view carries the shadow and is NOT clipped (on iOS `overflow:
 * hidden` would cut the shadow); the decorative layers live in an inner
 * clipped view.
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

  // expo-blur's web 'light' tint paints a near-white plate that hides the
  // backdrop; its neutral 'default' tint keeps the colors visible.
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
