import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

import { type LocalChatMessage, notifyChatTyping } from '@/api';
import { useTheme } from '@/theme';
import { ActionMenu, Glass, Icon, Text, Touchable } from '@/ui';

import { type AttachmentDraft, type AttachmentDraftState, attachmentSummary } from './attachments';

/** поле растёт до пяти строк, дальше прокручивается внутри */
const MAX_LINES = 5;
const MAX_LENGTH = 2000;
const SEND_SIZE = 36;
const DRAFT_SIZE = 60;

export type ComposerProps = {
  roomId: string;
  replyTo: LocalChatMessage | null;
  onCancelReply(): void;
  onSend(text: string): void;
  /** вложения следующего сообщения; нет — кнопки «скрепка» нет (Lobby — только текст) */
  attachments?: AttachmentDraftState;
  /** деньги в личном чате: в том же меню, кнопка тогда — «＋» */
  money?: { onTransfer(): void; onRequest(): void; onGift(): void };
};

/** многострочный ввод с подсказкой, полоса «Ответ …», выбранные файлы и круглая кнопка отправки */
export function Composer({ roomId, replyTo, onCancelReply, onSend, attachments, money }: ComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const input = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const files = attachments?.drafts ?? [];
  // пока файл загружается, отправка ждёт: иначе он не попадёт в сообщение
  const canSend =
    !attachments?.busy && (text.trim().length > 0 || (attachments?.ready.length ?? 0) > 0);
  const lineHeight = theme.typography.message.lineHeight ?? 20;

  useEffect(() => {
    if (replyTo) input.current?.focus();
  }, [replyTo]);

  const send = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  const change = (value: string) => {
    setText(value);
    if (value.trim()) notifyChatTyping(roomId);
  };

  // в браузере Enter отправляет, Shift+Enter — новая строка
  const keyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS !== 'web') return;
    const native = event.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
    if (native.key === 'Enter' && !native.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <View style={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.xs }}>
      {replyTo ? (
        <Glass variant="regular" radius={theme.radii.md}>
          <View
            style={[
              styles.row,
              {
                gap: theme.spacing.sm,
                paddingLeft: theme.spacing.md,
                paddingRight: theme.spacing.xs,
                paddingVertical: theme.spacing.xs,
              },
            ]}
          >
            <Icon name="reply" size={18} color={theme.colors.accent} />
            <View
              style={[styles.fill, { borderLeftWidth: 2, borderLeftColor: theme.colors.accent, paddingLeft: theme.spacing.sm }]}
            >
              <Text variant="bodyStrong" color="accent" numberOfLines={1}>
                {t('chat.reply.to', { name: replyTo.author?.name ?? '' })}
              </Text>
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                {attachmentSummary(replyTo, t)}
              </Text>
            </View>
            <Touchable
              onPress={onCancelReply}
              accessibilityLabel={t('chat.actions.cancelReply')}
              style={[styles.center, { width: theme.sizes.touchTarget, height: theme.sizes.touchTarget }]}
            >
              <Icon name="close" size={18} color={theme.colors.textMuted} />
            </Touchable>
          </View>
        </Glass>
      ) : null}

      {attachments?.unavailable ? (
        <Touchable onPress={attachments.dismissUnavailable} accessibilityRole="button">
          <Text variant="caption" color="textMuted" align="center">
            {t('chat.attachment.unavailable')}
          </Text>
        </Touchable>
      ) : null}

      {attachments && files.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
        >
          {files.map((draft) => (
            <DraftTile
              key={draft.key}
              draft={draft}
              onRemove={() => attachments.remove(draft.key)}
              onRetry={() => attachments.retry(draft.key)}
            />
          ))}
        </ScrollView>
      ) : null}

      <Glass variant="regular" radius={theme.radii.cardLg}>
        <View
          style={[
            styles.row,
            {
              alignItems: 'flex-end',
              gap: theme.spacing.sm,
              paddingLeft: attachments ? theme.spacing.xs + 2 : theme.spacing.lg,
              paddingRight: theme.spacing.xs + 2,
              paddingVertical: theme.spacing.xs + 2,
              minHeight: theme.sizes.touchTarget + theme.spacing.xs,
            },
          ]}
        >
          {attachments ? (
            <ActionMenu
              title={t(money ? 'chat.money.menu' : 'chat.attachment.pick')}
              cancelLabel={t('common.cancel')}
              accessibilityLabel={t(money ? 'chat.money.menu' : 'chat.attachment.pick')}
              triggerSize={{ width: SEND_SIZE, height: SEND_SIZE }}
              items={[
                {
                  id: 'photo',
                  label: t('chat.attachment.photo'),
                  systemImage: 'photo.on.rectangle',
                  onPress: () => void attachments.pickPhotos(),
                },
                {
                  id: 'file',
                  label: t('chat.attachment.file'),
                  systemImage: 'doc',
                  onPress: () => void attachments.pickFiles(),
                },
                ...(money
                  ? [
                      {
                        id: 'transfer',
                        label: t('chat.money.transfer'),
                        systemImage: 'arrow.up.right' as const,
                        onPress: money.onTransfer,
                      },
                      {
                        id: 'request',
                        label: t('chat.money.request'),
                        systemImage: 'arrow.down.left' as const,
                        onPress: money.onRequest,
                      },
                      {
                        id: 'gift',
                        label: t('chat.money.gift'),
                        systemImage: 'gift' as const,
                        onPress: money.onGift,
                      },
                    ]
                  : []),
              ]}
            >
              <View style={[styles.center, { width: SEND_SIZE, height: SEND_SIZE }]}>
                <Icon
                  name={money ? 'plus' : 'paperclip'}
                  size={22}
                  color={money ? theme.colors.accent : theme.colors.textMuted}
                />
              </View>
            </ActionMenu>
          ) : null}
          <TextInput
            ref={input}
            value={text}
            onChangeText={change}
            onKeyPress={keyPress}
            multiline
            maxLength={MAX_LENGTH}
            placeholder={t('chat.placeholder')}
            accessibilityLabel={t('chat.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            submitBehavior="newline"
            style={[
              styles.fill,
              theme.typography.message,
              // Safari на iPhone приближает страницу при фокусе в поле со шрифтом меньше 16px
              Platform.OS === 'web' ? styles.webFont : null,
              {
                color: theme.colors.textPrimary,
                maxHeight: lineHeight * MAX_LINES + theme.spacing.md,
                paddingTop: theme.spacing.sm,
                paddingBottom: theme.spacing.sm,
              },
            ]}
          />
          <Touchable
            onPress={send}
            disabled={!canSend}
            accessibilityLabel={t('chat.a11y.send')}
            accessibilityState={{ disabled: !canSend }}
            style={[
              styles.center,
              {
                width: SEND_SIZE,
                height: SEND_SIZE,
                borderRadius: SEND_SIZE / 2,
                backgroundColor: canSend ? theme.colors.accent : theme.colors.glassFill,
              },
            ]}
          >
            <Icon
              name="arrowUp"
              size={20}
              strokeWidth={2.2}
              color={canSend ? theme.colors.textInverse : theme.colors.textMuted}
            />
          </Touchable>
        </View>
      </Glass>
    </View>
  );
}

/** выбранный файл над полем: миниатюра или значок PDF, «×» — убрать; не загрузился — нажать, чтобы повторить */
function DraftTile({
  draft,
  onRemove,
  onRetry,
}: {
  draft: AttachmentDraft;
  onRemove(): void;
  onRetry(): void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const image = draft.file.mimeType.startsWith('image/');
  const failed = draft.status === 'failed';
  const label = failed
    ? `${t('chat.attachment.failed', { name: draft.file.name })}. ${t(`chat.errors.${draft.error ?? 'default'}`, { defaultValue: t('chat.errors.default') })}`
    : draft.status === 'uploading'
      ? t('chat.attachment.uploading', { name: draft.file.name })
      : draft.file.name;

  return (
    <View style={{ width: DRAFT_SIZE, height: DRAFT_SIZE }}>
      <Touchable
        haptic={false}
        onPress={failed ? onRetry : undefined}
        disabled={!failed}
        accessibilityLabel={label}
        style={[
          styles.center,
          styles.fillBox,
          {
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.glassFillStrong,
            borderWidth: failed ? 2 : StyleSheet.hairlineWidth,
            borderColor: failed ? theme.colors.negative : theme.colors.glassBorder,
            overflow: 'hidden',
          },
        ]}
      >
        {image ? (
          <Image source={{ uri: draft.file.uri }} resizeMode="cover" style={styles.fillBox} />
        ) : (
          <View style={[styles.center, { gap: 2, padding: theme.spacing.xs }]}>
            <Icon name="document" size={22} color={theme.colors.accent} />
            <Text variant="micro" color="textMuted" numberOfLines={1}>
              {draft.file.name}
            </Text>
          </View>
        )}
        {draft.status === 'uploading' ? (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: theme.colors.overlay }]}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
        ) : null}
        {failed ? (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: theme.colors.overlay }]}>
            <Icon name="refresh" size={20} color={theme.colors.negative} />
          </View>
        ) : null}
      </Touchable>
      <Touchable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t('chat.attachment.remove', { name: draft.file.name })}
        hitSlop={8}
        style={[
          styles.center,
          styles.removeDraft,
          {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: theme.colors.textPrimary,
          },
        ]}
      >
        <Icon name="close" size={12} strokeWidth={2.4} color={theme.colors.textInverse} />
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  fillBox: {
    width: '100%',
    height: '100%',
  },
  removeDraft: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  webFont: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
