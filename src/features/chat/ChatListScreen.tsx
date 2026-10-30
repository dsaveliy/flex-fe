import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { refreshChatRooms, useChatConnection, useChatMe, useChatRooms } from '@/api';
import { useTheme } from '@/theme';
import { ErrorState, GlassCard, Icon, Screen, Skeleton, Text, Touchable } from '@/ui';

import { ChatListRow } from './ChatListRow';
import { ConnectionBanner } from './ConnectionBanner';

/** «Сообщения»: открывается из профиля — Flex Lobby и личные чаты; «＋» в шапке — новый чат по номеру */
export function ChatListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const rooms = useChatRooms();
  const me = useChatMe();
  const { status } = useChatConnection();
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refreshChatRooms();
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  };

  const loading = rooms.length === 0 && !failed && status !== 'offline';

  return (
    <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
      <Stack.Screen
        options={{
          title: t('chat.title'),
          headerRight: () => (
            <Touchable
              onPress={() => router.push('/messages/new')}
              accessibilityRole="button"
              accessibilityLabel={t('chat.newChat.open')}
              style={styles.headerButton}
            >
              <Icon name="plus" color={theme.colors.accent} />
            </Touchable>
          ),
        }}
      />
      <ConnectionBanner />

      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.lg }}>
        {rooms.length > 0 ? (
          <GlassCard contentStyle={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs }}>
            {rooms.map((room, index) => (
              <ChatListRow
                key={room.id}
                room={room}
                me={me}
                showDivider={index < rooms.length - 1}
                onPress={() =>
                  router.push({ pathname: '/messages/[roomId]', params: { roomId: room.id } })
                }
              />
            ))}
          </GlassCard>
        ) : loading ? (
          <GlassCard contentStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
            {[0, 1].map((row) => (
              <View key={row} style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
                <Skeleton width={48} height={48} radius={24} />
                <View style={{ flex: 1, gap: theme.spacing.sm }}>
                  <Skeleton width="50%" height={16} />
                  <Skeleton width="85%" height={12} />
                </View>
              </View>
            ))}
          </GlassCard>
        ) : (
          <ErrorState onRetry={() => void refresh()} />
        )}

        {rooms.length > 0 ? (
          <Text variant="caption" color="textMuted" align="center">
            {rooms.some((room) => room.kind === 'direct')
              ? t('account.messagesHint')
              : t('chat.list.directHint')}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
});
