import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type GlassVariant = 'regular' | 'clear';

export type GlassProps = {
  /** Native glass style. `clear` is more transparent, `regular` is frosted. */
  variant?: GlassVariant;
  /** Optional tint applied on top of the glass. */
  tint?: ColorValue;
  /** Enables the native touch reaction of Liquid Glass. */
  interactive?: boolean;
  /** Corner radius; falls back to the `card` token when omitted. */
  radius?: number;
  /** Adds a soft drop shadow under the surface. */
  elevated?: boolean;
  /** Force the fallback rendering — used by the design showcase. */
  forceFallback?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
} & Pick<
  import('react-native').ViewProps,
  'accessibilityLabel' | 'accessibilityRole' | 'accessible' | 'pointerEvents' | 'onLayout'
>;

export type GlassGroupProps = {
  /** Distance at which neighbouring glass elements start merging. */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
};
