import { View } from 'react-native';

import type { ChatMember } from '@/api';
import { palette, useTheme } from '@/theme';
import { Glass, Icon, Text } from '@/ui';

/** у каждого собеседника свой постоянный цвет — так в Lobby легче различать авторов */
const AVATAR_COLORS = [
  palette.leafDark,
  palette.blobBlue,
  palette.cardPurpleB,
  palette.sunset,
  palette.blobTeal,
  palette.coinB,
  palette.coinG,
] as const;

export function avatarColor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export type ChatAvatarProps = {
  /** `null` — значок общего чата */
  member: ChatMember | null;
  size?: number;
  /** зелёная точка «онлайн» */
  online?: boolean;
};

export function ChatAvatar({ member, size = 32, online = false }: ChatAvatarProps) {
  const theme = useTheme();
  const dot = Math.max(8, Math.round(size * 0.26));

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      {member ? (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: avatarColor(member.id),
          }}
        >
          <Text
            variant={size >= 40 ? 'headline' : 'micro'}
            style={{ color: palette.white }}
            numberOfLines={1}
          >
            {member.initials}
          </Text>
        </View>
      ) : (
        <Glass
          variant="regular"
          radius={size / 2}
          tint={theme.colors.accentMuted}
          style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chat" size={size * 0.5} color={theme.colors.accent} />
        </Glass>
      )}
      {online ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            borderWidth: 2,
            borderColor: theme.colors.backgroundMid,
            backgroundColor: theme.colors.positive,
          }}
        />
      ) : null}
    </View>
  );
}
