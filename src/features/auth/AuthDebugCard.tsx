import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { AuthEvent } from '@/api/mock/auth/db';
import {
  expireAccessToken,
  recentAuthEvents,
  resetMockAuthDb,
  revokeCurrentSession,
  stealRefreshToken,
} from '@/api/mock/auth/devTools';
import { dropMockChatConnections } from '@/api/mock/chat';
import { useCryptoSession, useSession } from '@/auth';
import { clearBiometricCredential } from '@/auth/biometrics';
import { refreshSession, signOutLocal } from '@/auth/sessionActions';
import { useTheme } from '@/theme';
import { Chip, GlassCard, Text } from '@/ui';

import { formatWait } from './authErrors';
import { useNow } from './useCountdown';

/**
 * только `__DEV__` + mock: состояние токенов и кнопки, которые «на сервере»
 * воспроизводят сценарии приёмки — истечение access, кражу refresh, отзыв сессии
 */
export function AuthDebugCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const session = useSession();
  const crypto = useCryptoSession();
  const now = useNow(1000);
  const [events, setEvents] = useState<AuthEvent[]>([]);

  useEffect(() => {
    void recentAuthEvents().then(setEvents);
  }, [now]);

  const accessLeft = session.claims ? (session.claims.exp * 1000 - now) / 1000 : 0;
  const cryptoLeft =
    crypto.idleDeadline !== null && crypto.absoluteDeadline !== null
      ? (Math.min(crypto.idleDeadline, crypto.absoluteDeadline) - now) / 1000
      : null;

  const actions: { label: string; run: () => Promise<unknown> }[] = [
    {
      label: t('auth.debug.expireAccess'),
      // следующий запрос получит TOKEN_EXPIRED → тихий refresh и повтор
      run: async () => {
        await expireAccessToken();
        await queryClient.invalidateQueries();
      },
    },
    {
      label: t('auth.debug.stealRefresh'),
      // приложение предъявит уже отозванный refresh → кража → выход
      run: async () => {
        await stealRefreshToken();
        await refreshSession().catch(() => undefined);
      },
    },
    {
      label: t('auth.debug.revokeSession'),
      run: async () => {
        await revokeCurrentSession();
        await queryClient.invalidateQueries();
      },
    },
    {
      label: t('auth.debug.dropChat'),
      // как пропажа сети: плашка «Нет соединения», очередь и переподключение
      run: async () => dropMockChatConnections(),
    },
    {
      label: t('auth.debug.resetDb'),
      run: async () => {
        await resetMockAuthDb();
        await clearBiometricCredential();
        await signOutLocal('user');
      },
    },
  ];

  const row = (label: string, value: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
        {value}
      </Text>
    </View>
  );

  return (
    <GlassCard
      title={t('auth.debug.title')}
      contentStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
    >
      {row(t('auth.debug.role'), session.claims?.role ?? '—')}
      {row(t('auth.debug.session'), session.claims?.sid.slice(0, 8) ?? '—')}
      {row(t('auth.debug.access'), formatWait(accessLeft))}
      {row(
        t('auth.debug.crypto'),
        cryptoLeft === null
          ? t('auth.debug.cryptoClosed')
          : t('auth.debug.cryptoOpen', { time: formatWait(cryptoLeft) }),
      )}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.sm,
        }}
      >
        {actions.map((action) => (
          <Chip key={action.label} label={action.label} onPress={() => void action.run()} />
        ))}
      </View>

      <Text variant="label" color="textMuted" uppercase style={{ marginTop: theme.spacing.sm }}>
        {t('auth.debug.events')}
      </Text>
      {events.length === 0 ? (
        <Text variant="caption" color="textMuted">
          {t('auth.debug.noEvents')}
        </Text>
      ) : (
        events.map((event) => (
          <Text key={`${event.at}-${event.type}`} variant="caption" color="textMuted">
            {event.at.slice(11, 19)} · {event.type}
            {event.notify ? ` · ${t('auth.debug.notified')}` : ''}
          </Text>
        ))
      )}
    </GlassCard>
  );
}
