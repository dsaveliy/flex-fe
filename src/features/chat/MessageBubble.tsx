import * as Haptics from 'expo-haptics';
import { type ComponentProps, memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { ChatAttachment, ChatEmoji, ChatMember, LocalChatMessage } from '@/api';
import { useTheme } from '@/theme';
import { ActionMenu, Icon, Text, Touchable } from '@/ui';
import { formatTime } from '@/utils/format';

import { attachmentSummary } from './attachments';
import { avatarColor, BotLabel, ChatAvatar, StaffBadge } from './ChatAvatar';
import { DeliveryMark } from './DeliveryMark';
import { MessageAttachments } from './MessageAttachments';

/** насколько потянуть пузырь влево, чтобы ответить на него */
const REPLY_THRESHOLD = 56;
const REPLY_MAX = 72;
const AVATAR_SIZE = 30;

export type MessageBubbleProps = {
  message: LocalChatMessage;
  own: boolean;
  startsGroup: boolean;
  endsGroup: boolean;
  meId: string | undefined;
  /** собеседник прочитал (✓✓) */
  read: boolean;
  /** подсветка после перехода из поиска или цитаты */
  highlighted?: boolean;
  /** имя и аватар собеседника: в Lobby — да, в личном чате и так понятно, кто пишет */
  showAuthor?: boolean;
  /** аватар человека в Lobby → личный чат с ним */
  onAuthorPress?(author: ChatMember): void;
  onLongPress(message: LocalChatMessage): void;
  onReply(message: LocalChatMessage): void;
  onToggleReaction(message: LocalChatMessage, emoji: ChatEmoji): void;
  onRetry(message: LocalChatMessage): void;
  onDiscard(message: LocalChatMessage): void;
  onQuotePress(messageId: string): void;
  onOpenImage(attachment: ChatAttachment): void;
};

/**
 * пузырь сообщения: свои — мятные справа, чужие — стеклянные слева с аватаром.
 * удержание — реакции и ответ, свайп влево — ответить, под пузырём — реакции
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  own,
  startsGroup,
  endsGroup,
  meId,
  read,
  highlighted = false,
  showAuthor = true,
  onAuthorPress,
  onLongPress,
  onReply,
  onToggleReaction,
  onRetry,
  onDiscard,
  onQuotePress,
  onOpenImage,
}: MessageBubbleProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const offset = useSharedValue(0);
  const armed = useSharedValue(false);

  const vibrate = () => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const reply = () => onReply(message);

  const canInteract = message.delivery === 'sent';
  const swipe = Gesture.Pan()
    .enabled(canInteract)
    .activeOffsetX(-14)
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      offset.value = Math.max(-REPLY_MAX, Math.min(0, event.translationX));
      const past = offset.value <= -REPLY_THRESHOLD;
      if (past !== armed.value) {
        armed.value = past;
        if (past) scheduleOnRN(vibrate);
      }
    })
    .onEnd(() => {
      if (armed.value) scheduleOnRN(reply);
      armed.value = false;
      offset.value = withSpring(0, theme.springs.press);
    });

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));
  // в браузере жест на каждом пузыре перехватывает касания и тормозит прокрутку:
  // ответ там — из меню по удержанию
  const swipeEnabled = Platform.OS !== 'web';
  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(-offset.value, [0, REPLY_THRESHOLD], [0, 1]),
    transform: [{ scale: interpolate(-offset.value, [0, REPLY_THRESHOLD], [0.6, 1]) }],
  }));

  const ink = own ? theme.colors.textInverse : theme.colors.textPrimary;
  const tail = theme.radii.xs;
  const radius = theme.radii.card;
  const time = formatTime(message.createdAt);
  const authorName = message.author?.name ?? '';

  const handleLongPress = () => {
    if (!canInteract) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress(message);
  };

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: own ? 'flex-end' : 'flex-start',
          marginTop: startsGroup ? theme.spacing.md : theme.spacing.xxs,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
      ]}
    >
      {!own && showAuthor ? (
        <View style={{ width: AVATAR_SIZE }}>
          {endsGroup ? (
            <AuthorAvatar author={message.author} onPress={onAuthorPress} />
          ) : null}
        </View>
      ) : null}

      <View style={[styles.column, { alignItems: own ? 'flex-end' : 'flex-start' }]}>
        <SwipeArea enabled={swipeEnabled} gesture={swipe} style={bubbleStyle}>
          <Touchable
            haptic={false}
            pressedScale={0.98}
            delayLongPress={320}
            onLongPress={handleLongPress}
            accessibilityRole="text"
            accessibilityLabel={t('chat.a11y.message', {
              name: own
                ? t('chat.you')
                : message.author?.isBot
                  ? `${authorName}, ${t('chat.bot')}`
                  : authorName,
              time,
              text: attachmentSummary(message, t),
            })}
            accessibilityHint={canInteract ? t('chat.a11y.messageActions') : undefined}
            hitSlop={0}
            style={[
              styles.bubble,
              styles.noSelect,
              {
                paddingHorizontal: theme.spacing.md,
                paddingTop: theme.spacing.sm,
                paddingBottom: theme.spacing.xs + 2,
                borderTopLeftRadius: radius,
                borderTopRightRadius: radius,
                borderBottomLeftRadius: !own && endsGroup ? tail : radius,
                borderBottomRightRadius: own && endsGroup ? tail : radius,
                backgroundColor: own ? theme.colors.accent : theme.colors.glassFillStrong,
                borderWidth: own ? 0 : StyleSheet.hairlineWidth,
                borderColor: theme.colors.glassBorder,
                opacity: message.delivery === 'failed' ? 0.7 : 1,
              },
              highlighted && {
                borderWidth: 2,
                borderColor: own ? theme.colors.textInverse : theme.colors.accent,
              },
            ]}
          >
            {!own && showAuthor && startsGroup && authorName ? (
              <View style={[styles.author, { gap: theme.spacing.xs }]}>
                <Text
                  variant="bodyStrong"
                  numberOfLines={1}
                  style={[styles.authorName, { color: avatarColor(message.author?.id ?? '') }]}
                >
                  {authorName}
                </Text>
                {message.author?.isBot ? <BotLabel /> : null}
                {message.author?.isStaff ? <StaffBadge /> : null}
              </View>
            ) : null}

            {message.replyTo ? (
              <Touchable
                haptic={false}
                pressedScale={1}
                onPress={() => onQuotePress(message.replyTo?.id ?? '')}
                accessibilityLabel={t('chat.reply.to', {
                  name: message.replyTo.authorName,
                })}
                style={[
                  styles.quote,
                  {
                    borderLeftColor: own ? theme.colors.textInverse : theme.colors.accent,
                    backgroundColor: own ? theme.colors.glassFill : theme.colors.accentMuted,
                    borderRadius: theme.radii.sm,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    marginBottom: theme.spacing.xs,
                  },
                ]}
              >
                <Text variant="bodyStrong" numberOfLines={1} style={{ color: ink }}>
                  {message.replyTo.authorName}
                </Text>
                <Text variant="caption" numberOfLines={2} style={{ color: ink, opacity: 0.8 }}>
                  {message.replyTo.text || t('chat.attachment.generic')}
                </Text>
              </Touchable>
            ) : null}

            {message.attachments.length > 0 ? (
              <MessageAttachments attachments={message.attachments} own={own} onOpenImage={onOpenImage} />
            ) : null}

            {message.text ? (
              <Text variant="message" style={[{ color: ink }, styles.noSelect]}>
                {message.text}
              </Text>
            ) : null}

            <View style={[styles.meta, { gap: theme.spacing.xs }]}>
              <Text variant="micro" style={{ color: ink, opacity: 0.7 }}>
                {time}
              </Text>
              {own ? (
                <DeliveryMark
                  state={message.delivery === 'sent' && read ? 'read' : message.delivery}
                  color={ink}
                />
              ) : null}
            </View>
          </Touchable>
        </SwipeArea>

        {/* значок «ответить» проявляется на месте, которое освобождает пузырь */}
        {swipeEnabled ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.replyHint, { right: theme.spacing.md }, hintStyle]}
          >
            <Icon name="reply" size={18} color={theme.colors.textMuted} />
          </Animated.View>
        ) : null}

        {message.reactions.length > 0 ? (
          <View style={[styles.reactions, { gap: theme.spacing.xs, marginTop: theme.spacing.xs }]}>
            {message.reactions.map((reaction) => {
              const mine = Boolean(meId) && reaction.userIds.includes(meId ?? '');
              return (
                <Touchable
                  key={reaction.emoji}
                  onPress={() => onToggleReaction(message, reaction.emoji)}
                  accessibilityLabel={t('chat.a11y.reaction', {
                    emoji: reaction.emoji,
                    count: reaction.userIds.length,
                  })}
                  accessibilityState={{ selected: mine }}
                  hitSlop={theme.spacing.xs}
                  style={[
                    styles.reaction,
                    {
                      gap: theme.spacing.xxs,
                      paddingHorizontal: theme.spacing.sm,
                      height: 26,
                      borderRadius: theme.radii.pill,
                      backgroundColor: mine
                        ? theme.colors.pillSelectedFill
                        : theme.colors.glassFill,
                      borderColor: mine ? theme.colors.accent : theme.colors.glassBorder,
                    },
                  ]}
                >
                  <Text variant="body">{reaction.emoji}</Text>
                  <Text variant="micro" color={mine ? 'accent' : 'textMuted'}>
                    {reaction.userIds.length}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        ) : null}

        {message.delivery === 'failed' ? (
          <View style={{ marginTop: theme.spacing.xs }}>
            <ActionMenu
              title={t('chat.failed.title')}
              cancelLabel={t('common.cancel')}
              accessibilityLabel={t('chat.failed.title')}
              items={[
                {
                  id: 'retry',
                  label: t('chat.failed.retry'),
                  systemImage: 'arrow.clockwise',
                  onPress: () => onRetry(message),
                },
                {
                  id: 'discard',
                  label: t('chat.failed.discard'),
                  systemImage: 'trash',
                  onPress: () => onDiscard(message),
                },
              ]}
            >
              <View style={[styles.failed, { gap: theme.spacing.xs }]}>
                <DeliveryMark state="failed" color={theme.colors.negative} />
                <Text variant="caption" color="negative">
                  {t(`chat.errors.${message.errorCode ?? 'default'}`, {
                    defaultValue: t('chat.errors.default'),
                  })}
                  {' · '}
                  {t('chat.failed.retry')}
                </Text>
              </View>
            </ActionMenu>
          </View>
        ) : null}
      </View>
    </View>
  );
});

/** свайп для ответа: на web только обёртка без жеста */
function SwipeArea({
  enabled,
  gesture,
  style,
  children,
}: {
  enabled: boolean;
  gesture: ReturnType<typeof Gesture.Pan>;
  style: ComponentProps<typeof Animated.View>['style'];
  children: ReactNode;
}) {
  if (!enabled) return <View style={styles.swipeArea}>{children}</View>;
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.swipeArea, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}

/** аватар у конца группы; у человека (не бота) по нажатию — личный чат с ним */
function AuthorAvatar({
  author,
  onPress,
}: {
  author: ChatMember | null;
  onPress?: (author: ChatMember) => void;
}) {
  const { t } = useTranslation();
  const avatar = <ChatAvatar member={author} size={AVATAR_SIZE} />;
  if (!author || author.isBot || !onPress) return avatar;
  return (
    <Touchable
      onPress={() => onPress(author)}
      accessibilityRole="button"
      accessibilityLabel={t('chat.writeDirect', { name: author.name })}
      hitSlop={6}
    >
      {avatar}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  // долгое нажатие открывает меню реакций, а не выделение текста Safari
  noSelect: {
    userSelect: 'none',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    maxWidth: '78%',
  },
  swipeArea: {
    maxWidth: '100%',
  },
  bubble: {
    minWidth: 64,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorName: {
    flexShrink: 1,
  },
  quote: {
    borderLeftWidth: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  replyHint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  failed: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
