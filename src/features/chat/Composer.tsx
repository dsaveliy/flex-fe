import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

import { type LocalChatMessage, notifyChatTyping } from '@/api';
import { useTheme } from '@/theme';
import { Glass, Icon, Text, Touchable } from '@/ui';

/** поле растёт до пяти строк, дальше прокручивается внутри */
const MAX_LINES = 5;
const MAX_LENGTH = 2000;
const SEND_SIZE = 36;

export type ComposerProps = {
  roomId: string;
  replyTo: LocalChatMessage | null;
  onCancelReply(): void;
  onSend(text: string): void;
};

/** многострочный ввод с подсказкой, полоса «Ответ …» и круглая кнопка отправки */
export function Composer({ roomId, replyTo, onCancelReply, onSend }: ComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const input = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;
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
        <Glass variant="regular" radius={theme.radii.md} blur>
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
                {replyTo.text}
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

      <Glass variant="regular" radius={theme.radii.cardLg} blur>
        <View
          style={[
            styles.row,
            {
              alignItems: 'flex-end',
              gap: theme.spacing.sm,
              paddingLeft: theme.spacing.lg,
              paddingRight: theme.spacing.xs + 2,
              paddingVertical: theme.spacing.xs + 2,
              minHeight: theme.sizes.touchTarget + theme.spacing.xs,
            },
          ]}
        >
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

const styles = StyleSheet.create({
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
