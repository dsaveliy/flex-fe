import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import type { GlassVariant } from './Glass.types';
import { Text } from './Text';

export type GlassCardProps = {
  children: ReactNode;
  /** Optional section title rendered in the card header. */
  title?: string;
  /** Right-hand header slot (e.g. a "See all ›" action). */
  headerRight?: ReactNode;
  variant?: GlassVariant;
  radius?: number;
  padding?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
};

/** Standard content container: glass surface + optional titled header. */
export function GlassCard({
  children,
  title,
  headerRight,
  variant = 'regular',
  radius,
  padding,
  style,
  contentStyle,
  testID,
}: GlassCardProps) {
  const theme = useTheme();
  const innerPadding = padding ?? theme.spacing.xl;

  return (
    <Glass
      variant={variant}
      radius={radius ?? theme.radii.widget}
      style={style}
      testID={testID}
    >
      <View style={[{ padding: innerPadding }, contentStyle]}>
        {(title || headerRight) && (
          <View style={[styles.header, { marginBottom: theme.spacing.lg }]}>
            {title ? <Text variant="sectionTitle">{title}</Text> : <View />}
            {headerRight}
          </View>
        )}
        {children}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
