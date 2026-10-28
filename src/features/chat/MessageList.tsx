import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';

import {
  type ChatEmoji,
  type ChatRoomFeed,
  discardChatMessage,
  type LocalChatMessage,
  loadOlderChatMessages,
  reloadChatRoom,
  retryChatMessage,
  toggleChatReaction,
} from '@/api';
import { useTheme } from '@/theme';
import { ErrorState, Skeleton, Text } from '@/ui';

import { buildFeed, type FeedItem } from './feed';
import { DateSeparator, SystemMessage } from './FeedNotes';
import { MessageBubble } from './MessageBubble';

const HIGHLIGHT_MS = 1_800;

export type MessageListProps = {
  roomId: string;
  feed: ChatRoomFeed;
  meId: string | undefined;
  /** до какого сообщения прочитал собеседник — ✓✓ у своих до него включительно */
  peerLastReadMessageId: string | null;
  /** прокрутить к сообщению и подсветить его (из поиска или цитаты) */
  focusMessageId: string | null;
  onFocusHandled(): void;
  onLongPress(message: LocalChatMessage): void;
  onReply(message: LocalChatMessage): void;
};

/** лента комнаты: перевёрнутый список — новые снизу, при прокрутке вверх догружается история */
export function MessageList({
  roomId,
  feed,
  meId,
  peerLastReadMessageId,
  focusMessageId,
  onFocusHandled,
  onLongPress,
  onReply,
}: MessageListProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const list = useRef<FlatList<FeedItem>>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const items = useMemo(() => buildFeed(feed.messages, meId), [feed.messages, meId]);

  /** время прочтения собеседником: всё своё не позже него — ✓✓ */
  const readUntil = useMemo(() => {
    const read = feed.messages.find((message) => message.id === peerLastReadMessageId);
    return read ? Date.parse(read.createdAt) : null;
  }, [feed.messages, peerLastReadMessageId]);

  const scrollTo = useCallback(
    (messageId: string) => {
      const index = items.findIndex(
        (item) => item.type === 'message' && item.message.id === messageId,
      );
      if (index < 0) return;
      list.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
      setHighlighted(messageId);
      setTimeout(() => setHighlighted((current) => (current === messageId ? null : current)), HIGHLIGHT_MS);
    },
    [items],
  );

  useEffect(() => {
    if (!focusMessageId) return;
    // после возврата из поиска список монтируется заново — ждём первой раскладки
    const timer = setTimeout(() => {
      scrollTo(focusMessageId);
      onFocusHandled();
    }, 120);
    return () => clearTimeout(timer);
  }, [focusMessageId, onFocusHandled, scrollTo]);

  const react = useCallback(
    (message: LocalChatMessage, emoji: ChatEmoji) => toggleChatReaction(roomId, message.id, emoji),
    [roomId],
  );
  const retry = useCallback(
    (message: LocalChatMessage) => message.clientId && retryChatMessage(message.clientId),
    [],
  );
  const discard = useCallback(
    (message: LocalChatMessage) => message.clientId && discardChatMessage(roomId, message.clientId),
    [roomId],
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item.type === 'date') return <DateSeparator iso={item.iso} />;
      if (item.message.kind === 'system') return <SystemMessage text={item.message.text} />;
      return (
        <MessageBubble
          message={item.message}
          own={item.own}
          startsGroup={item.startsGroup}
          endsGroup={item.endsGroup}
          meId={meId}
          read={readUntil !== null && Date.parse(item.message.createdAt) <= readUntil}
          highlighted={highlighted === item.message.id}
          onLongPress={onLongPress}
          onReply={onReply}
          onToggleReaction={react}
          onRetry={retry}
          onDiscard={discard}
          onQuotePress={scrollTo}
        />
      );
    },
    [discard, highlighted, meId, onLongPress, onReply, react, readUntil, retry, scrollTo],
  );

  if (feed.messages.length === 0) {
    if (feed.history.status === 'error') {
      return (
        <View style={[styles.fill, styles.center, { padding: theme.spacing.xl }]}>
          <ErrorState onRetry={() => reloadChatRoom(roomId)} />
        </View>
      );
    }
    if (feed.history.status !== 'ready') return <FeedSkeleton />;
    return (
      <View style={[styles.fill, styles.center, { padding: theme.spacing.xxxl, gap: theme.spacing.sm }]}>
        <Text variant="headline" align="center">
          {t('chat.empty.title')}
        </Text>
        <Text variant="body" color="textMuted" align="center">
          {t('chat.empty.subtitle')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={list}
      style={styles.fill}
      data={items}
      inverted
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      extraData={highlighted}
      onEndReached={() => void loadOlderChatMessages(roomId)}
      onEndReachedThreshold={0.4}
      onScrollToIndexFailed={({ averageItemLength, index }) => {
        // строка ещё не измерена: приблизительно доезжаем и пробуем снова
        list.current?.scrollToOffset({ offset: averageItemLength * index, animated: false });
        setTimeout(() => list.current?.scrollToIndex({ index, viewPosition: 0.5 }), 80);
      }}
      ListFooterComponent={
        feed.history.loadingMore ? (
          <ActivityIndicator style={{ padding: theme.spacing.lg }} color={theme.colors.accent} />
        ) : null
      }
      contentContainerStyle={{ paddingVertical: theme.spacing.sm }}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
}

/** скелет ленты: чередующиеся пузыри слева и справа */
function FeedSkeleton() {
  const theme = useTheme();
  const rows = [
    { own: false, width: '62%' },
    { own: false, width: '44%' },
    { own: true, width: '52%' },
    { own: false, width: '70%' },
    { own: true, width: '38%' },
  ] as const;

  return (
    <View style={[styles.fill, { justifyContent: 'flex-end', padding: theme.spacing.lg, gap: theme.spacing.md }]}>
      {rows.map((row, index) => (
        <View key={index} style={{ alignItems: row.own ? 'flex-end' : 'flex-start' }}>
          <Skeleton width={row.width} height={40} radius={theme.radii.card} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
