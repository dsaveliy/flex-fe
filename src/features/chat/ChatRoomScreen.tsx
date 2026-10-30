import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { HeaderHeightContext } from 'expo-router/build/react-navigation/elements';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type ChatAttachment,
  type ChatMember,
  closeSupportChat,
  isApiError,
  type LocalChatMessage,
  openDirectChat,
  sendChatMessage,
  toggleChatReaction,
  useChatMe,
  useDeclineMoneyRequest,
  useOpenGift,
  useChatRoom,
  useChatRoomInfo,
} from '@/api';
import { type ThemeColors, useTheme } from '@/theme';
import {
  Icon,
  Screen,
  SearchField,
  Text,
  Touchable,
  useBrowserBarInset,
  useKeyboardInset,
} from '@/ui';
import { formatTime } from '@/utils/format';

import { useAttachmentDraft } from './attachments';
import { ChatAvatar } from './ChatAvatar';
import { Composer } from './Composer';
import { ConnectionBanner } from './ConnectionBanner';
import { dayLabel } from './feed';
import { ImageViewer } from './ImageViewer';
import { MessageActions } from './MessageActions';
import { MessageList } from './MessageList';
import { QuickReplies, RatingCard } from './SupportExtras';
import { TypingIndicator } from './TypingIndicator';

/** сколько показывать «не удалось открыть личный чат» */
const ACTION_ERROR_MS = 3_000;

/** экран комнаты: лента, «печатает», поле ввода; поиск по загруженной истории — из шапки */
export function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
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
  // в браузере клавиатуру считаем по видимой области: KeyboardAvoidingView там не работает
  const webKeyboard = useKeyboardInset();

  const [actionError, setActionError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ChatAttachment | null>(null);
  const attachments = useAttachmentDraft();

  const direct = room?.kind === 'direct';
  const support = room?.kind === 'support';
  // у сотрудника в обращении собеседник — клиент; у клиента — «Поддержка Flex» без собеседника
  const staffView = support && room.peer !== null;
  const peerOnline = (direct || support) && room.onlineCount > 0;
  // файлы — в личных чатах и в поддержке (скриншоты), Lobby читают все клиенты
  const filesAllowed = direct || support;
  const title = room?.title ?? t('chat.title');
  const subtitle =
    room?.kind === 'lobby'
      ? t('chat.online', { count: room.onlineCount })
      : direct || staffView
        ? t(peerOnline ? 'chat.peer.online' : 'chat.peer.offline')
        : support
          ? t(peerOnline ? 'chat.support.staffOnline' : 'chat.support.replyTime')
          : undefined;
  // быстрые ответы — клиенту, пока он ничего не написал в этом обращении
  const quickReplies =
    support &&
    !staffView &&
    !room.closedAt &&
    feed.history.status === 'ready' &&
    !feed.messages.some((message) => message.author?.id === me?.id);

  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), ACTION_ERROR_MS);
    return () => clearTimeout(timer);
  }, [actionError]);

  // оценку приняли: карточка пропадает, на её месте ненадолго — «Спасибо»
  const [thanked, setThanked] = useState(false);
  const couldRate = useRef(false);
  const canRate = Boolean(support && room.canRate);
  useEffect(() => {
    if (couldRate.current && !canRate && room?.closedAt) setThanked(true);
    couldRate.current = canRate;
  }, [canRate, room?.closedAt]);
  useEffect(() => {
    if (!thanked) return;
    const timer = setTimeout(() => setThanked(false), ACTION_ERROR_MS);
    return () => clearTimeout(timer);
  }, [thanked]);

  // аватар человека в Lobby → личный чат с ним (комната та же, если уже переписывались)
  const writeDirect = useCallback(
    (author: ChatMember) => {
      if (author.isBot || author.id === me?.id) return;
      openDirectChat({ userId: author.id }).then(
        (next) => router.push({ pathname: '/messages/[roomId]', params: { roomId: next.id } }),
        () => setActionError(t('chat.directError')),
      );
    },
    [me?.id, router, t],
  );

  const send = (text: string) => {
    sendChatMessage(roomId, text, replyTo, filesAllowed ? attachments.ready : []);
    attachments.clear();
    setReplyTo(null);
  };
  const closeTicket = () => {
    closeSupportChat(roomId).catch(() => setActionError(t('chat.support.closeError')));
  };

  // деньги в личном чате: шторка суммы, ответы сервера придут в ленту кадрами
  const openGift = useOpenGift();
  const declineRequest = useDeclineMoneyRequest();
  const moneyError = useCallback(
    (failure: unknown) =>
      setActionError(
        isApiError(failure)
          ? t(`operations.errors.${failure.code}`, { defaultValue: t('operations.errors.generic') })
          : t('operations.errors.generic'),
      ),
    [t],
  );
  const openMoney = (mode: 'transfer' | 'request' | 'gift') =>
    router.push({ pathname: '/messages/money', params: { roomId, mode } });
  const payRequest = useCallback(
    (message: LocalChatMessage) => {
      if (message.money?.type !== 'request') return;
      router.push({
        pathname: '/messages/money',
        params: {
          roomId,
          mode: 'pay',
          requestId: message.money.requestId,
          amount: String(message.money.amount.amountMinor),
          currency: message.money.amount.currency,
        },
      });
    },
    [roomId, router],
  );
  const { mutate: decline } = declineRequest;
  const { mutate: open } = openGift;
  const onDecline = useCallback(
    (requestId: string) => decline(requestId, { onError: moneyError }),
    [decline, moneyError],
  );
  const onOpenGift = useCallback(
    (giftId: string) => open(giftId, { onError: moneyError }),
    [open, moneyError],
  );
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
          headerTitle: () => (
            <RoomTitle
              title={title}
              subtitle={subtitle}
              subtitleColor={(direct || support) && !peerOnline ? 'textMuted' : 'accent'}
            />
          ),
          headerRight: () => (
            <View style={styles.row}>
              {staffView && !room.closedAt && me?.isStaff ? (
                <Touchable
                  onPress={closeTicket}
                  accessibilityRole="button"
                  accessibilityLabel={t('chat.support.close')}
                  style={styles.headerButton}
                >
                  <Icon name="check" color={theme.colors.accent} />
                </Touchable>
              ) : null}
              <Touchable
                onPress={() => setSearching((value) => !value)}
                accessibilityLabel={t(searching ? 'chat.search.close' : 'chat.search.open')}
                style={styles.headerButton}
              >
                <Icon name={searching ? 'close' : 'search'} color={theme.colors.accent} />
              </Touchable>
            </View>
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
            showAuthors={!direct}
            emptySubtitle={
              direct
                ? t('chat.empty.directSubtitle', { name: room.title })
                : support
                  ? t('chat.support.emptySubtitle')
                  : undefined
            }
            onAuthorPress={room?.kind === 'lobby' ? writeDirect : undefined}
            onOpenImage={setViewing}
            onPayRequest={payRequest}
            onDeclineRequest={onDecline}
            onOpenGift={onOpenGift}
            onLongPress={setActionsFor}
            onReply={setReplyTo}
          />
        )}
        {searching ? null : (
          <>
            <TypingIndicator users={feed.typing} />
            {canRate ? <RatingCard roomId={roomId} /> : null}
            {thanked ? (
              <Text
                variant="bodyStrong"
                color="accent"
                align="center"
                accessibilityLiveRegion="polite"
                style={{ paddingBottom: theme.spacing.sm }}
              >
                {t('chat.support.rate.thanks')}
              </Text>
            ) : null}
            {quickReplies ? <QuickReplies onPick={(text) => sendChatMessage(roomId, text)} /> : null}
            {actionError ? (
              <Text
                variant="caption"
                color="negative"
                align="center"
                style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xs }}
              >
                {actionError}
              </Text>
            ) : null}
            <Composer
              roomId={roomId}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onSend={send}
              attachments={filesAllowed ? attachments : undefined}
              money={
                direct
                  ? {
                      onTransfer: () => openMoney('transfer'),
                      onRequest: () => openMoney('request'),
                      onGift: () => openMoney('gift'),
                    }
                  : undefined
              }
            />
          </>
        )}
        <View
          style={{
            height: webKeyboard
              ? webKeyboard + theme.spacing.sm
              : keyboardShown
                ? theme.spacing.sm
                : insets.bottom + browserBar + theme.spacing.sm,
          }}
        />
      </KeyboardAvoidingView>

      <ImageViewer image={viewing} onClose={() => setViewing(null)} />

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

function RoomTitle({
  title,
  subtitle,
  subtitleColor = 'accent',
}: {
  title: string;
  subtitle?: string;
  subtitleColor?: keyof ThemeColors;
}) {
  return (
    <View style={styles.title} accessible accessibilityRole="header">
      <Text variant="headline" numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" color={subtitleColor} numberOfLines={1}>
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
