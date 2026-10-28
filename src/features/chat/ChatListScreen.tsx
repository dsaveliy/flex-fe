import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { refreshChatRooms, useChatConnection, useChatMe, useChatRooms } from '@/api';
import { useTheme } from '@/theme';
import { ErrorState, GlassCard, Screen, Skeleton, Text } from '@/ui';

import { ChatListRow } from './ChatListRow';
import { ConnectionBanner } from './ConnectionBanner';

/** «Сообщения»: открывается из профиля; в спринте 5 здесь Flex Lobby, дальше — поддержка и личные чаты */
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
      <Stack.Screen options={{ title: t('chat.title') }} />
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
            {t('account.messagesHint')}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
