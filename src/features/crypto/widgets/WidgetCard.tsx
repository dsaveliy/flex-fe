import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { ErrorState, GlassCard, Icon, type IconName, Skeleton, Text } from '@/ui';

export type WidgetCardProps = {
  width: number;
  height: number;
  /** мелкая подпись вида виджета в углу (иконка и название), как у системных виджетов */
  icon?: IconName;
  title?: string;
  /** справа от заголовка */
  headerRight?: ReactNode;
  state?: 'ready' | 'loading' | 'error';
  onRetry?: () => void;
  children?: ReactNode;
};

/** стеклянная плитка виджета: единые поля, заголовок и состояния загрузки/ошибки */
export function WidgetCard({
  width,
  height,
  icon,
  title,
  headerRight,
  state = 'ready',
  onRetry,
  children,
}: WidgetCardProps) {
  const theme = useTheme();

  return (
    <GlassCard padding={theme.spacing.lg} style={{ width, height }} contentStyle={styles.fill}>
      {title ? (
        <View style={[styles.header, { gap: theme.spacing.xs, marginBottom: theme.spacing.sm }]}>
          {icon ? <Icon name={icon} size={14} color={theme.colors.textMuted} /> : null}
          <Text variant="micro" color="textMuted" numberOfLines={1} style={styles.fill}>
            {title.toUpperCase()}
          </Text>
          {headerRight}
        </View>
      ) : null}
      {state === 'loading' ? (
        <View style={[styles.fill, { gap: theme.spacing.sm }]}>
          <Skeleton width="60%" height={18} />
          <Skeleton height={14} />
          <Skeleton width="80%" height={14} />
        </View>
      ) : state === 'error' ? (
        <View style={[styles.fill, styles.center]}>
          {onRetry && height > 120 ? (
            <ErrorState onRetry={onRetry} />
          ) : (
            <Icon name="refresh" size={20} color={theme.colors.textMuted} />
          )}
        </View>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
