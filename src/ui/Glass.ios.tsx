import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import type { GlassGroupProps, GlassProps } from './Glass.types';
import { GlassFallback } from './GlassFallback';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';

/** iOS 26+ check, evaluated once per process. */
export const isNativeGlassAvailable = isLiquidGlassAvailable();

/**
 * The single glass primitive of the design system.
 *
 * On iOS 26+ it renders the native `UIVisualEffectView`-backed Liquid Glass.
 * Everywhere else (and when Reduce Transparency is on) it falls back to the
 * blur-based imitation so the layout stays identical.
 *
 * Rules enforced by usage, not by code:
 * - never nest glass more than one level deep;
 * - always place glass above rich content so refraction is visible.
 */
export function Glass({
  variant = 'regular',
  tint,
  interactive = false,
  radius,
  elevated = true,
  forceFallback = false,
  style,
  children,
  testID,
  ...viewProps
}: GlassProps) {
  const theme = useTheme();
  const { reduceTransparency } = useAccessibilityFlags();

  const cornerRadius = radius ?? theme.radii.card;

  if (forceFallback || reduceTransparency || !isNativeGlassAvailable) {
    return (
      <GlassFallback
        {...viewProps}
        variant={variant}
        tint={tint}
        radius={cornerRadius}
        elevated={elevated}
        style={style}
        testID={testID}
      >
        {children}
      </GlassFallback>
    );
  }

  return (
    <GlassView
      {...viewProps}
      testID={testID}
      glassEffectStyle={variant}
      tintColor={tint}
      isInteractive={interactive}
      colorScheme={theme.isDark ? 'dark' : 'light'}
      style={[
        styles.surface,
        { borderRadius: cornerRadius },
        elevated ? theme.shadows.soft : null,
        style,
      ]}
    >
      {children}
    </GlassView>
  );
}

/**
 * Groups neighbouring glass surfaces so iOS blends/morphs them together
 * (tab bar items, action button rows, segmented controls).
 */
export function GlassGroup({ spacing, style, children, testID }: GlassGroupProps) {
  const { reduceTransparency } = useAccessibilityFlags();

  if (reduceTransparency || !isNativeGlassAvailable) {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <GlassContainer spacing={spacing} style={style} testID={testID}>
      {children}
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
  },
});
