import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { rateSupportChat } from '@/api';
import { useTheme } from '@/theme';
import { GlassButton, GlassCard, Icon, Text, Touchable } from '@/ui';

const QUICK_KEYS = ['transfer', 'card', 'crypto', 'login'] as const;
const STARS = [1, 2, 3, 4, 5] as const;

/** быстрые ответы поддержки: частые вопросы одним нажатием, уходят обычным текстом */
export function QuickReplies({ onPick }: { onPick(text: string): void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.xs, paddingBottom: theme.spacing.xs }}>
      <Text variant="caption" color="textMuted" style={{ paddingHorizontal: theme.spacing.lg }}>
        {t('chat.support.quickTitle')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}
      >
        {QUICK_KEYS.map((key) => {
          const text = t(`chat.support.quick.${key}`);
          return (
            <Touchable
              key={key}
              onPress={() => onPick(text)}
              accessibilityRole="button"
              accessibilityLabel={text}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accentMuted,
              }}
            >
              <Text variant="bodyStrong" color="accent">
                {text}
              </Text>
            </Touchable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** оценка закрытого обращения: звёзды 1–5 и необязательный комментарий */
export function RatingCard({ roomId }: { roomId: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!score) return;
    setPending(true);
    setError(null);
    rateSupportChat(roomId, score, comment).catch(() => {
      setPending(false);
      setError(t('chat.support.rate.error'));
    });
  };

  return (
    <GlassCard
      style={{ marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm }}
      contentStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
    >
      <Text variant="headline" align="center">
        {t('chat.support.rate.title')}
      </Text>
      <View style={[styles.stars, { gap: theme.spacing.sm }]} accessibilityRole="radiogroup">
        {STARS.map((value) => (
          <Touchable
            key={value}
            onPress={() => setScore(value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: score === value }}
            accessibilityLabel={t('chat.support.rate.star', { count: value })}
            hitSlop={theme.spacing.xs}
          >
            <Icon
              name="star"
              size={32}
              color={value <= score ? theme.colors.accent : theme.colors.textMuted}
            />
          </Touchable>
        ))}
      </View>
      {score > 0 ? (
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={t('chat.support.rate.comment')}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={t('chat.support.rate.comment')}
          maxLength={500}
          style={[
            theme.typography.body,
            styles.comment,
            {
              color: theme.colors.textPrimary,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.glassFill,
            },
          ]}
        />
      ) : null}
      {error ? (
        <Text variant="caption" color="negative" align="center">
          {error}
        </Text>
      ) : null}
      {score > 0 ? (
        <GlassButton
          label={pending ? '…' : t('chat.support.rate.submit')}
          accent
          onPress={pending ? undefined : submit}
          size={theme.sizes.touchTarget}
          style={{ alignSelf: 'stretch' }}
        />
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  // Safari на iPhone приближает страницу при фокусе в поле со шрифтом меньше 16px
  comment: {
    fontSize: 16,
  },
});
