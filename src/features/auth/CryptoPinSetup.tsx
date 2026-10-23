import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { CryptoSession } from '@/api/types';
import {
  isValidPin,
  openCryptoSession,
  PIN_LENGTH,
  useBiometryKind,
  useCryptoSetup,
  useSetBiometric,
} from '@/auth';
import { useTheme } from '@/theme';
import { GlassButton, GlassCard } from '@/ui';

import { authErrorMessage } from './authErrors';
import { GateMessage } from './GateMessage';
import { PinDots } from './PinDots';
import { PinPad } from './PinPad';

type Stage = 'create' | 'confirm' | 'biometric';

/**
 * первый вход в криптораздел: обязательная настройка PIN (дважды), затем
 * предложение входить по Face ID. раздел открывается после этого выбора
 */
export function CryptoPinSetup() {
  const { t } = useTranslation();
  const theme = useTheme();
  const setup = useCryptoSetup();
  const setBiometric = useSetBiometric();
  const biometry = useBiometryKind().data ?? null;
  const [stage, setStage] = useState<Stage>('create');
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [session, setSession] = useState<CryptoSession | null>(null);

  const fail = (message: string) => {
    setError(message);
    setErrorKey((key) => key + 1);
    setPin('');
    setFirst('');
    setStage('create');
  };

  const complete = (value: string) => {
    if (stage === 'create') {
      setFirst(value);
      setPin('');
      setError(null);
      setStage('confirm');
      return;
    }
    if (value !== first || !isValidPin(value)) {
      fail(t('auth.crypto.mismatch'));
      return;
    }
    setup.mutate(value, {
      onSuccess: (created) => {
        if (biometry) {
          setSession(created);
          setStage('biometric');
        } else {
          openCryptoSession(created);
        }
      },
      onError: (failure) => fail(authErrorMessage(failure, t)),
    });
  };

  const addDigit = (digit: string) => {
    if (setup.isPending || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) complete(next);
  };

  if (stage === 'biometric' && session && biometry) {
    const kind = t(`auth.biometry.${biometry}`);
    const open = (enable: boolean) => {
      openCryptoSession(session);
      if (enable) setBiometric.mutate(true);
    };
    return (
      <GlassCard contentStyle={{ padding: theme.spacing.xxl, gap: theme.spacing.xl }}>
        <GateMessage
          icon="faceId"
          title={t('auth.crypto.bioOfferTitle', { kind })}
          text={t('auth.crypto.bioOfferText')}
        />
        <View style={{ gap: theme.spacing.md }}>
          <GlassButton
            accent
            label={t('auth.crypto.enable')}
            onPress={() => open(true)}
            size={theme.sizes.touchTarget + theme.spacing.xs}
            style={{ alignSelf: 'stretch' }}
          />
          <GlassButton
            label={t('auth.crypto.notNow')}
            onPress={() => open(false)}
            size={theme.sizes.touchTarget + theme.spacing.xs}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </GlassCard>
    );
  }

  const confirming = stage === 'confirm';

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.xxl, paddingTop: theme.spacing.lg }}>
      <GateMessage
        icon="lock"
        title={t(confirming ? 'auth.crypto.confirmTitle' : 'auth.crypto.setupTitle')}
        text={error ?? t(confirming ? 'auth.crypto.confirmSubtitle' : 'auth.crypto.setupSubtitle')}
        tone={error ? 'negative' : 'muted'}
      />
      <PinDots length={PIN_LENGTH} filled={pin.length} errorKey={errorKey} />
      <PinPad
        onDigit={addDigit}
        onDelete={() => setPin((value) => value.slice(0, -1))}
        disabled={setup.isPending}
      />
    </View>
  );
}
