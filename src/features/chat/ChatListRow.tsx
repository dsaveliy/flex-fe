import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { ChatMember, ChatRoom } from '@/api';
import { useTheme } from '@/theme';
import { Text, Touchable } from '@/ui';
import { formatTime } from '@/utils/format';

import { ChatAvatar } from './ChatAvatar';
import { dayLabel } from './feed';

const AVATAR = 48;

export type ChatListRowProps = {
  room: ChatRoom;
  me: ChatMember | null;
  showDivider?: boolean;
  onPress(): void;
};

/** строка списка: аватар, название, «Анна К.: текст», время и счётчик непрочитанных */
export function ChatListRow({ room, me, showDivider = false, onPress }: ChatListRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const last = room.lastMessage;
  const today = last && new Date(last.createdAt).toDateString() === new Date().toDateString();
  const author = last?.author
    ? last.author.id === me?.id
      ? t('chat.you')
      : room.kind === 'lobby'
        ? last.author.name
        : null
    : null;
  const preview = last ? (author ? `${author}: ${last.text}` : last.text) : t('chat.list.noMessages');
  const subtitle = room.kind === 'lobby' ? t('chat.online', { count: room.onlineCount }) : null;

  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={[room.title, subtitle, preview].filter(Boolean).join(', ')}
      style={[
        styles.row,
        {
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: theme.colors.divider,
        },
      ]}
    >
      <ChatAvatar
        member={room.kind === 'lobby' ? null : room.peer}
        size={AVATAR}
        online={room.kind === 'direct' && room.onlineCount > 0}
      />
      <View style={[styles.fill, { gap: 2 }]}>
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          <Text variant="headline" numberOfLines={1} style={styles.fill}>
            {room.title}
          </Text>
          {last ? (
            <Text variant="caption" color={room.unreadCount ? 'accent' : 'textMuted'}>
              {today ? formatTime(last.createdAt) : dayLabel(last.createdAt, t)}
            </Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text variant="caption" color="accent" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          <Text variant="body" color="textMuted" numberOfLines={2} style={styles.fill}>
            {preview}
          </Text>
          {room.unreadCount > 0 ? <UnreadBadge count={room.unreadCount} /> : null}
        </View>
      </View>
    </Touchable>
  );
}

/** мятная капсула с числом; больше 99 — «99+» */
export function UnreadBadge({ count }: { count: number }) {
  const theme = useTheme();
  const size = 22;

  return (
    <View
      style={{
        minWidth: size,
        height: size,
        borderRadius: size / 2,
        paddingHorizontal: theme.spacing.xs + 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.accent,
      }}
    >
      <Text variant="micro" color="textInverse">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    flex: 1,
  },
});
