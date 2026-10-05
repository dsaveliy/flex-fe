import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type GlassVariant = 'regular' | 'clear';

export type GlassProps = {
  /** нативный стиль стекла. `clear` более прозрачный, `regular` матовый */
  variant?: GlassVariant;
  /** необязательный оттенок поверх стекла */
  tint?: ColorValue;
  /** включает нативную реакцию Liquid Glass на касание */
  interactive?: boolean;
  /** радиус скругления; если не указан, используется токен `card` */
  radius?: number;
  /** добавляет мягкую тень под поверхностью */
  elevated?: boolean;
  /** принудительно использовать запасной рендеринг — нужно для демонстрации дизайна */
  forceFallback?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
} & Pick<
  import('react-native').ViewProps,
  'accessibilityLabel' | 'accessibilityRole' | 'accessible' | 'pointerEvents' | 'onLayout'
>;

export type GlassGroupProps = {
  /** расстояние, на котором соседние стеклянные элементы начинают сливаться */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
};
