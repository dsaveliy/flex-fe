import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { isApiError } from '@/api';
import type { CryptoAccessStatus } from '@/api/types';
import {
  BIOMETRIC_CANCELLED,
  PIN_LENGTH,
  useBiometryKind,
  useCryptoLogin,
  useCryptoSession,
} from '@/auth';
import { useTheme } from '@/theme';
import { GlassCard } from '@/ui';

import { authErrorMessage, formatWait } from './authErrors';
import { GateMessage } from './GateMessage';
import { PinDots } from './PinDots';
import { PinPad } from './PinPad';
import { useCountdown } from './useCountdown';

/**
 * вход в криптораздел (step-up): крипто-PIN или Face ID → crypto-токен.
 * 3 ошибки — блокировка на 15 минут, 10 — только через поддержку
 */
export function CryptoUnlock({ status }: { status: CryptoAccessStatus }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { lockReason } = useCryptoSession();
  const focused = useIsFocused();
  const biometry = useBiometryKind().data ?? null;
  const login = useCryptoLogin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  // ответ сервера приходит раньше, чем обновится статус, — блокируем сразу
  const [localLockUntil, setLocalLockUntil] = useState<number | null>(null);
  const [localBlocked, setLocalBlocked] = useState(false);

  const serverLockUntil = status.lockedUntil ? Date.parse(status.lockedUntil) : null;
  const wait = useCountdown(Math.max(serverLockUntil ?? 0, localLockUntil ?? 0) || null);
  const locked = wait > 0;
  const blocked = status.blocked || localBlocked;
  const canUseBiometric = status.biometricEnabled && biometry !== null && !locked && !blocked;

  const handleError = (failure: unknown) => {
    setPin('');
    if (isApiError(failure, BIOMETRIC_CANCELLED)) return;
    setErrorKey((key) => key + 1);
    if (isApiError(failure, 'TOO_MANY_ATTEMPTS')) {
      setLocalLockUntil(Date.now() + (failure.retryAfter ?? 0) * 1000);
      setError(null);
    } else if (isApiError(failure, 'CRYPTO_LOCKED')) {
      setLocalBlocked(true);
    } else {
      setError(authErrorMessage(failure, t));
    }
  };

  const unlockWithBiometric = () =>
    login.mutate(
      { type: 'biometric', prompt: t('auth.crypto.biometricPrompt') },
      { onError: handleError },
    );

  // Face ID предлагается сразу, но один раз и только на видимой вкладке:
  // раздел может закрыться по таймауту, пока пользователь на Home
  const autoPrompted = useRef(false);
  useEffect(() => {
    if (!focused || !canUseBiometric || autoPrompted.current || lockReason === 'manual') return;
    autoPrompted.current = true;
    unlockWithBiometric();
  }, [focused, canUseBiometric]);

  const addDigit = (digit: string) => {
    if (login.isPending || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setError(null);
    if (next.length === PIN_LENGTH) {
      login.mutate({ type: 'pin', pin: next }, { onError: handleError });
    }
  };

  if (blocked) {
    return (
      <GlassCard contentStyle={{ padding: theme.spacing.xxl }}>
        <GateMessage
          icon="lock"
          title={t('auth.crypto.blockedTitle')}
          text={t('auth.crypto.blockedText')}
        />
      </GlassCard>
    );
  }

  const subtitle = locked
    ? t('auth.crypto.lockedUntil', { time: formatWait(wait) })
    : (error ??
      (lockReason ? t(`auth.crypto.lockReason.${lockReason}`) : t('auth.crypto.unlockSubtitle')));

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.xxl, paddingTop: theme.spacing.lg }}>
      <GateMessage
        icon="lock"
        title={t(locked ? 'auth.crypto.lockedTitle' : 'auth.crypto.unlockTitle')}
        text={subtitle}
        tone={error && !locked ? 'negative' : 'muted'}
      />
      <PinDots length={PIN_LENGTH} filled={pin.length} errorKey={errorKey} />
      <PinPad
        onDigit={addDigit}
        onDelete={() => setPin((value) => value.slice(0, -1))}
        disabled={locked || login.isPending}
        biometric={
          canUseBiometric && biometry
            ? {
                label: t('auth.crypto.useBiometric', { kind: t(`auth.biometry.${biometry}`) }),
                onPress: unlockWithBiometric,
              }
            : null
        }
      />
    </View>
  );
}
