import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useChatUnreadCount, useUser } from '@/api';
import { useTheme } from '@/theme';

import { isNativeGlassAvailable } from './Glass';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';
import { Touchable } from './Pressable';
import { ProfileAvatar } from './ProfileAvatar';

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

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={t('a11y.openProfile')}
      accessibilityHint={unread > 0 ? t('a11y.unreadMessages') : undefined}
      pressedScale={isNativeGlassAvailable && !reduceTransparency ? 1 : 0.94}
      onPress={() => router.push('/account')}
    >
      <ProfileAvatar user={user.data} size={diameter} interactive />
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
