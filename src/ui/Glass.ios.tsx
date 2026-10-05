import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import type { GlassGroupProps, GlassProps } from './Glass.types';
import { GlassFallback } from './GlassFallback';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';

/** проверка iOS 26+, вычисляется один раз на процесс */
export const isNativeGlassAvailable = isLiquidGlassAvailable();

/**
 * единственный стеклянный примитив дизайн-системы.
 *
 * на iOS 26+ рендерит нативный Liquid Glass на основе `UIVisualEffectView`.
 * в остальных случаях (и когда включено Reduce Transparency) он
 * откатывается к имитации на основе размытия, чтобы раскладка не менялась.
 *
 * правила, которые соблюдаются использованием, а не кодом:
 * - никогда не вкладывать стекло глубже чем на один уровень;
 * - всегда размещать стекло над насыщенным контентом, чтобы было видно преломление.
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
 * группирует соседние стеклянные поверхности, чтобы iOS смешивала и
 * преобразовывала их вместе (элементы таб-бара, ряды кнопок действий,
 * сегментированные контролы).
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
