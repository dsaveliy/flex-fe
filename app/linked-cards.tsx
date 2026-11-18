import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ApiError, useCards, useLinkedCards, useUnlinkCard, useUpdateLinkedCard } from '@/api';
import type { LinkedCard } from '@/api/types';
import { MAX_CARDS_PER_USER } from '@/features/cards/cardLimits';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { useTheme } from '@/theme';
import { ErrorState, GlassButton, GlassCard, Screen, Skeleton, Text, TextField } from '@/ui';

export default function LinkedCardsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const cards = useCards();
  const linked = useLinkedCards();
  const atLimit = (cards.data?.length ?? 0) + (linked.data?.length ?? 0) >= MAX_CARDS_PER_USER;

  return (
    <Screen>
      <Stack.Screen options={{ title: t('cards.linked.title'), headerTintColor: theme.colors.textPrimary }} />
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        {linked.isPending ? <Skeleton height={88} /> : linked.isError ? (
          <ErrorState onRetry={() => linked.refetch()} />
        ) : linked.data.length === 0 ? (
          <Text align="center" color="textMuted">{t('cards.linked.empty')}</Text>
        ) : linked.data.map((card) => <LinkedCardItem key={card.id} card={card} />)}
        {atLimit ? (
          <Text align="center" color="textMuted">{t('cards.add.limit', { max: MAX_CARDS_PER_USER })}</Text>
        ) : (
          <GlassButton label={t('cards.add.link')} onPress={() => router.push('/link-card')} />
        )}
      </View>
    </Screen>
  );
}

function LinkedCardItem({ card }: { card: LinkedCard }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const update = useUpdateLinkedCard();
  const unlink = useUnlinkCard();
  const [mode, setMode] = useState<'view' | 'rename' | 'unlink'>('view');
  const [nickname, setNickname] = useState('');
  const error = update.error ?? unlink.error;
  const busy = update.isPending || unlink.isPending;
  const cardNumber = `${card.brand === 'visa' ? 'Visa' : 'Mastercard'} •• ${card.last4}`;
  const close = () => {
    update.reset();
    unlink.reset();
    setMode('view');
  };

  return (
    <GlassCard title={card.nickname || cardNumber}>
      <View style={{ gap: theme.spacing.sm }}>
        {card.nickname ? <Text color="textMuted">{cardNumber}</Text> : null}
        {mode === 'rename' ? (
          <TextField label={t('cards.linked.nickname')} value={nickname} onChangeText={setNickname} maxLength={40} />
        ) : null}
        {mode === 'unlink' ? <Text>{t('cards.linked.confirmUnlink', { last4: card.last4 })}</Text> : null}
        {error ? (
          <Text color="negative" accessibilityRole="alert">
            {error instanceof ApiError && [401, 403, 404].includes(error.status)
              ? t('cards.linked.unavailable')
              : operationErrorMessage(error, t)}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {mode === 'view' ? (
            <>
              <GlassButton label={t('cards.linked.rename')} onPress={() => {
                setNickname(card.nickname ?? '');
                setMode('rename');
              }} />
              <GlassButton label={t('cards.linked.unlink')} onPress={() => setMode('unlink')} />
            </>
          ) : (
            <>
              <GlassButton
                label={t(mode === 'rename' ? 'cards.linked.save' : 'cards.linked.unlink')}
                onPress={busy ? undefined : () => {
                  if (mode === 'rename') update.mutate({ cardId: card.id, nickname: nickname.trim() || null }, { onSuccess: close });
                  else unlink.mutate(card.id);
                }}
              />
              <GlassButton label={t('common.cancel')} onPress={busy ? undefined : close} />
            </>
          )}
        </View>
      </View>
    </GlassCard>
  );
}
