import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { ChatEmoji, LocalChatMessage } from '@/api';
import { useTheme } from '@/theme';
import { Glass, GlassCard, Icon, ListRow, Text, Touchable } from '@/ui';

import { attachmentSummary } from './attachments';

export const CHAT_EMOJI: ChatEmoji[] = ['👍', '❤️', '😂', '🔥', '🚀', '🙏'];

export type MessageActionsProps = {
  message: LocalChatMessage | null;
  meId: string | undefined;
  onClose(): void;
  onReact(message: LocalChatMessage, emoji: ChatEmoji): void;
  onReply(message: LocalChatMessage): void;
};

/**
 * меню по удержанию сообщения: стеклянная панель реакций и «Ответить» над затемнением.
 * одинаковое на iOS, Android и web — у системных меню нет строки эмодзи
 */
export function MessageActions({ message, meId, onClose, onReact, onReply }: MessageActionsProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const run = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <Modal visible={Boolean(message)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
      />
      {message ? (
        <View
          pointerEvents="box-none"
          style={[styles.center, { padding: theme.spacing.xl, gap: theme.spacing.md }]}
        >
          <Glass variant="regular" radius={theme.radii.pill} blur elevated>
            <View
              style={[
                styles.row,
                { gap: theme.spacing.xxs, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
              ]}
            >
              {CHAT_EMOJI.map((emoji) => {
                const mine = Boolean(
                  meId && message.reactions.find((item) => item.emoji === emoji)?.userIds.includes(meId),
                );
                return (
                  <Touchable
                    key={emoji}
                    onPress={() => run(() => onReact(message, emoji))}
                    accessibilityLabel={emoji}
                    accessibilityState={{ selected: mine }}
                    style={[
                      styles.emoji,
                      {
                        width: theme.sizes.touchTarget,
                        height: theme.sizes.touchTarget,
                        borderRadius: theme.radii.pill,
                        backgroundColor: mine ? theme.colors.pillSelectedFill : undefined,
                      },
                    ]}
                  >
                    <Text variant="title">{emoji}</Text>
                  </Touchable>
                );
              })}
            </View>
          </Glass>

          <View
            style={{
              maxWidth: '86%',
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radii.card,
              backgroundColor: theme.colors.glassSelected,
            }}
          >
            {message.author ? (
              <Text variant="bodyStrong" color="textMuted" numberOfLines={1}>
                {message.author.id === meId ? t('chat.you') : message.author.name}
              </Text>
            ) : null}
            <Text variant="message" numberOfLines={6}>
              {attachmentSummary(message, t)}
            </Text>
          </View>

          <GlassCard
            style={{ minWidth: 220 }}
            contentStyle={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs }}
          >
            <ListRow
              title={t('chat.actions.reply')}
              left={<Icon name="reply" color={theme.colors.accent} />}
              onPress={() => run(() => onReply(message))}
            />
          </GlassCard>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
