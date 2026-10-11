import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/theme';
import { AvatarButton, GlassButton, Icon, Text, Touchable, useAccessibilityFlags } from '@/ui';

export type EditControlsProps = {
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onAdd: () => void;
};

/**
 * правая часть шапки Crypto: карандаш и аватар. в режиме редактирования мятная
 * кнопка растягивается вправо в «Готово» и накрывает аватар ровно по его месту,
 * поэтому зелёная кнопка не прыгает; слева от неё появляется «+».
 * кнопка сплошная, без стекла: стекло дёргается при изменении ширины, а аватар
 * просвечивал бы сквозь него и пропадал рывком
 */
export function EditControls({ editing, onEdit, onDone, onAdd }: EditControlsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const size = theme.sizes.avatarLarge;
  const gap = theme.spacing.sm;
  const wide = size * 2 + gap;

  // аватар остаётся под растущей кнопкой до конца анимации, иначе он пропал бы раньше, чем его накрыли
  const [avatarShown, setAvatarShown] = useState(!editing);
  const progress = useSharedValue(editing ? 1 : 0);

  useEffect(() => {
    if (!editing) setAvatarShown(true);
    const target = editing ? 1 : 0;
    const hideAvatar = () => setAvatarShown(false);
    if (reduceMotion) {
      progress.value = target;
      if (editing) hideAvatar();
      return;
    }
    progress.value = withTiming(
      target,
      { duration: theme.durations.slow + 120, easing: Easing.bezier(0.32, 0.72, 0, 1) },
      (finished) => {
        if (finished && target === 1) scheduleOnRN(hideAvatar);
      },
    );
  }, [editing, progress, reduceMotion, theme.durations.slow]);

  const buttonStyle = useAnimatedStyle(() => ({
    width: size + (wide - size) * progress.value,
  }));
  // карандаш гаснет в первой половине пути, «Готово» проявляется во второй — без каши посередине
  const pencilStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 0.45], [1, 0.8], Extrapolation.CLAMP) }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.row, { gap }]}>
      {editing ? (
        <GlassButton
          shape="circle"
          icon="plus"
          size={size}
          onPress={onAdd}
          accessibilityLabel={t('crypto.addWidget')}
        />
      ) : null}
      <View style={{ width: wide, height: size }}>
        {avatarShown ? (
          <View style={styles.avatar}>
            <AvatarButton size={size} />
          </View>
        ) : null}
        <Animated.View style={[styles.button, { height: size }, buttonStyle]}>
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={editing ? t('crypto.done') : t('crypto.edit')}
            onPress={editing ? onDone : onEdit}
            style={styles.fill}
          >
            <View
              style={[
                styles.fill,
                theme.shadows.soft,
                { borderRadius: theme.radii.pill, backgroundColor: theme.colors.accent },
              ]}
            >
              <Animated.View style={[styles.center, pencilStyle]} pointerEvents="none">
                <Icon name="pencil" size={22} color={theme.colors.textInverse} />
              </Animated.View>
              <Animated.View style={[styles.center, labelStyle]} pointerEvents="none">
                <Text variant="button" color="textInverse" numberOfLines={1}>
                  {t('crypto.done')}
                </Text>
              </Animated.View>
            </View>
          </Touchable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  // кнопка поверх аватара, растёт от левого края кластера
  button: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  fill: {
    flex: 1,
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
