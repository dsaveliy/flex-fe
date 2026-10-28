import { Stack, useLocalSearchParams } from 'expo-router';
import { HeaderHeightContext } from 'expo-router/build/react-navigation/elements';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type LocalChatMessage,
  sendChatMessage,
  toggleChatReaction,
  useChatMe,
  useChatRoom,
  useChatRoomInfo,
} from '@/api';
import { useTheme } from '@/theme';
import { Icon, Screen, SearchField, Text, Touchable, useBrowserBarInset } from '@/ui';
import { formatTime } from '@/utils/format';

import { ChatAvatar } from './ChatAvatar';
import { Composer } from './Composer';
import { ConnectionBanner } from './ConnectionBanner';
import { dayLabel } from './feed';
import { MessageActions } from './MessageActions';
import { MessageList } from './MessageList';
import { TypingIndicator } from './TypingIndicator';

/** экран комнаты: лента, «печатает», поле ввода; поиск по загруженной истории — из шапки */
export function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const browserBar = useBrowserBarInset();
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const room = useChatRoomInfo(roomId);
  const me = useChatMe();
  const feed = useChatRoom(roomId);
  const [replyTo, setReplyTo] = useState<LocalChatMessage | null>(null);
  const [actionsFor, setActionsFor] = useState<LocalChatMessage | null>(null);
  const [searching, setSearching] = useState(false);
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);
  const keyboardShown = useKeyboardShown();

  const title = room?.title ?? t('chat.title');
  const subtitle =
    room?.kind === 'lobby' ? t('chat.online', { count: room.onlineCount }) : undefined;

  const send = (text: string) => {
    sendChatMessage(roomId, text, replyTo);
    setReplyTo(null);
  };
  const clearFocus = useCallback(() => setFocusMessageId(null), []);

  return (
    <Screen
      scrollable={false}
      contentBottomInset={0}
      contentContainerStyle={{ paddingTop: headerHeight }}
    >
      <Stack.Screen
        options={{
          title,
          headerTitle: () => <RoomTitle title={title} subtitle={subtitle} />,
          headerRight: () => (
            <Touchable
              onPress={() => setSearching((value) => !value)}
              accessibilityLabel={t(searching ? 'chat.search.close' : 'chat.search.open')}
              style={styles.headerButton}
            >
              <Icon name={searching ? 'close' : 'search'} color={theme.colors.accent} />
            </Touchable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      >
        <ConnectionBanner />
        {searching ? (
          <SearchResults
            messages={feed.messages}
            meId={me?.id}
            onPick={(message) => {
              setSearching(false);
              setFocusMessageId(message.id);
            }}
          />
        ) : (
          <MessageList
            roomId={roomId}
            feed={feed}
            meId={me?.id}
            peerLastReadMessageId={room?.peerLastReadMessageId ?? null}
            focusMessageId={focusMessageId}
            onFocusHandled={clearFocus}
            onLongPress={setActionsFor}
            onReply={setReplyTo}
          />
        )}
        {searching ? null : (
          <>
            <TypingIndicator users={feed.typing} />
            <Composer
              roomId={roomId}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onSend={send}
            />
          </>
        )}
        <View
          style={{
            height: keyboardShown ? theme.spacing.sm : insets.bottom + browserBar + theme.spacing.sm,
          }}
        />
      </KeyboardAvoidingView>

      <MessageActions
        message={actionsFor}
        meId={me?.id}
        onClose={() => setActionsFor(null)}
        onReact={(message, emoji) => toggleChatReaction(roomId, message.id, emoji)}
        onReply={setReplyTo}
      />
    </Screen>
  );
}

function RoomTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.title} accessible accessibilityRole="header">
      <Text variant="headline" numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" color="accent" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** поиск по уже загруженной ленте; выбор результата прокручивает к сообщению и подсвечивает его */
function SearchResults({
  messages,
  meId,
  onPick,
}: {
  messages: LocalChatMessage[];
  meId: string | undefined;
  onPick(message: LocalChatMessage): void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase();

  const results = useMemo(
    () =>
      needle
        ? messages.filter(
            (message) =>
              message.delivery === 'sent' && message.text.toLocaleLowerCase().includes(needle),
          )
        : [],
    [messages, needle],
  );

  return (
    <View style={styles.fill}>
      <SearchField
        placeholder={t('chat.search.placeholder')}
        value={query}
        onChangeText={setQuery}
        style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}
      />
      <FlatList
        data={results}
        keyExtractor={(message) => message.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.xs }}
        ListEmptyComponent={
          needle ? (
            <Text variant="body" color="textMuted" align="center" style={{ padding: theme.spacing.xl }}>
              {t('chat.search.empty')}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Touchable
            onPress={() => onPick(item)}
            accessibilityLabel={item.text}
            style={[
              styles.result,
              {
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.glassFill,
              },
            ]}
          >
            <ChatAvatar member={item.author} size={32} />
            <View style={[styles.fill, { gap: 2 }]}>
              <View style={[styles.row, { gap: theme.spacing.sm }]}>
                <Text variant="bodyStrong" numberOfLines={1} style={styles.fill}>
                  {item.author?.id === meId ? t('chat.you') : (item.author?.name ?? '')}
                </Text>
                <Text variant="caption" color="textMuted">
                  {`${dayLabel(item.createdAt, t)}, ${formatTime(item.createdAt)}`}
                </Text>
              </View>
              <Text variant="body" numberOfLines={2}>
                {item.text}
              </Text>
            </View>
          </Touchable>
        )}
      />
    </View>
  );
}

/** открыта ли клавиатура: тогда отступ под домашний индикатор не нужен */
function useKeyboardShown(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setShown(true));
    const hide = Keyboard.addListener(hideEvent, () => setShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return shown;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    alignItems: 'center',
    maxWidth: 220,
  },
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
