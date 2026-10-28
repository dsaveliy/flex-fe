import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useChatUnreadCount, useUser } from '@/api';
import { useTheme } from '@/theme';

import { Glass, isNativeGlassAvailable } from './Glass';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';
import { Touchable } from './Pressable';
import { Text } from './Text';

export type AvatarButtonProps = {
  size?: number;
};

/**
 * стеклянный круг с фото или инициалами пользователя в правом верхнем углу
 * экранов (как в макете). открывает экран профиля.
 */
export function AvatarButton({ size }: AvatarButtonProps) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { reduceTransparency } = useAccessibilityFlags();
  const user = useUser();
  const unread = useChatUnreadCount();

  const diameter = size ?? theme.sizes.iconButton;
  const initials = user.data
    ? `${user.data.firstName.charAt(0)}${user.data.lastName.charAt(0)}`
    : '';

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={t('a11y.openProfile')}
      accessibilityHint={unread > 0 ? t('a11y.unreadMessages') : undefined}
      pressedScale={isNativeGlassAvailable && !reduceTransparency ? 1 : 0.94}
      onPress={() => router.push('/account')}
    >
      <Glass
        variant="regular"
        interactive
        radius={diameter / 2}
        style={{
          width: diameter,
          height: diameter,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {user.data?.avatarUrl ? (
          <Image
            source={{ uri: user.data.avatarUrl }}
            style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
          />
        ) : (
          <Text
            variant="bodyStrong"
            color="accent"
            style={{ fontSize: diameter * 0.36, lineHeight: diameter * 0.44 }}
          >
            {initials}
          </Text>
        )}
      </Glass>
      {/* точка: есть непрочитанные сообщения (вход в чаты — из профиля) */}
      {unread > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: theme.spacing.md,
            height: theme.spacing.md,
            borderRadius: theme.spacing.md / 2,
            borderWidth: 2,
            borderColor: theme.colors.backgroundMid,
            backgroundColor: theme.colors.accent,
          }}
        />
      ) : null}
    </Touchable>
  );
}
