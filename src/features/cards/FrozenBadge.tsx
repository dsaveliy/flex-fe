import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { palette, useTheme } from '@/theme';
import { Icon, Text } from '@/ui';

export type FrozenBadgeProps = {
  /** прогресс льда 0..1 */
  progress: SharedValue<number>;
  /** внутренний отступ пластика — плашка стоит на нём в углу */
  inset: number;
};

/**
 * плашка «Заморожена» в правом нижнем углу пластика, на месте типа карты.
 * тёмный текст на белом читается на любом цвете карты; проступает к концу намерзания.
 */
export function FrozenBadge({ progress, inset }: FrozenBadgeProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.55, 0.9], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0.55, 0.9, 1], [0.7, 1.05, 1], 'clamp') }],
  }));

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          right: inset,
          bottom: inset,
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs + 1,
          borderRadius: theme.radii.pill,
        },
        pillStyle,
      ]}
    >
      <View style={[StyleSheet.absoluteFill, styles.pillFill]} />
      <Icon name="snowflake" size={13} color={palette.iceDeep} strokeWidth={2} />
      <Text variant="micro" style={{ color: palette.textPrimary }}>
        {t('cards.frozen')}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillFill: {
    backgroundColor: palette.white,
    opacity: 0.85,
  },
});
