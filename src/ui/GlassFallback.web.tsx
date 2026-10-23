import { View, type ViewStyle } from 'react-native';

import { type Theme, useTheme } from '@/theme';

import type { GlassProps } from './Glass.types';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';

const CLEAR = 'rgba(255, 255, 255, 0)';

/** `#RRGGBB` + прозрачность → `rgba(...)` для box-shadow */
function rgba(hex: string, alpha: number): string {
  const value = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/** тень-токен React Native → CSS box-shadow (react-native-web иначе сам смешает её с нашей) */
function outerShadow(shadow: Theme['shadows']['card']): string {
  const color = typeof shadow.shadowColor === 'string' ? shadow.shadowColor : '#000000';
  return `0 ${shadow.shadowOffset?.height ?? 0}px ${shadow.shadowRadius ?? 0}px ${rgba(color, Number(shadow.shadowOpacity ?? 0))}`;
}

/**
 * имитация Liquid Glass для браузера. в отличие от native-запасного варианта всё
 * стекло — CSS одного элемента, без слоёв поверх детей: абсолютно спозиционированные
 * слои в браузере рисуются над SVG-иконками и прятали их.
 *
 * размытие фона (`backdrop-filter`) дорогое для мобильных браузеров при прокрутке,
 * поэтому оно только у поверхностей с `blur` — тех, что плавают над контентом
 * (таб-бар, меню). карточки лежат на мягком градиенте страницы, размытие там не видно.
 */
export function GlassFallback({
  variant = 'regular',
  tint,
  radius,
  elevated = true,
  blur = false,
  style,
  children,
  testID,
  ...viewProps
}: GlassProps) {
  const theme = useTheme();
  const { reduceTransparency } = useAccessibilityFlags();

  const cornerRadius = radius ?? theme.radii.card;
  const isClear = variant === 'clear';
  const solid = reduceTransparency;
  const fill = solid
    ? theme.isDark
      ? '#16211D'
      : '#FFFFFF'
    : (tint ??
      // над контентом стекло плотнее, как системные панели iOS: подписи читаются поверх текста
      (blur
        ? theme.colors.glassTint
        : isClear
          ? theme.colors.glassFill
          : theme.colors.glassFillStrong));

  // кромка: светлая сверху (свет падает сверху), едва заметная снизу — как у стекла iOS
  const rimTop = theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.75)';
  const rimBottom = theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)';
  const shadows = [
    elevated ? outerShadow(theme.shadows.card) : null,
    `inset 0 1px 1px ${rimTop}`,
    `inset 0 -1px 1px ${rimBottom}`,
  ].filter(Boolean);

  const backdrop =
    blur && !solid ? `blur(${Math.round(theme.blurIntensity / 2)}px) saturate(180%)` : undefined;

  const glass = {
    borderRadius: cornerRadius,
    borderWidth: 1,
    borderTopColor: theme.colors.glassBorder,
    borderLeftColor: theme.colors.glassBorder,
    borderBottomColor: theme.colors.glassEdgeLow,
    borderRightColor: theme.colors.glassEdgeLow,
    backgroundColor: fill,
    // блик по диагонали сверху слева и тень глубины снизу
    backgroundImage: solid
      ? undefined
      : `linear-gradient(135deg, ${theme.colors.glassHighlight} 0%, ${CLEAR} 45%), ` +
        `linear-gradient(180deg, ${CLEAR} 55%, ${theme.colors.glassShade} 100%)`,
    boxShadow: shadows.join(', '),
    backdropFilter: backdrop,
    // Safari до 18 понимает только свойство с префиксом
    WebkitBackdropFilter: backdrop,
  } as ViewStyle;

  return (
    <View {...viewProps} testID={testID} style={[glass, style]}>
      {children}
    </View>
  );
}
