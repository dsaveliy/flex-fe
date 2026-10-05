import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import type { GlassVariant } from './Glass.types';
import { Text } from './Text';

export type GlassCardProps = {
  children: ReactNode;
  /** необязательный заголовок секции в шапке карточки */
  title?: string;
  /** правый слот шапки (например, действие "See all ›") */
  headerRight?: ReactNode;
  variant?: GlassVariant;
  radius?: number;
  padding?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
};

/** стандартный контейнер контента: стеклянная поверхность и необязательная шапка с заголовком */
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
