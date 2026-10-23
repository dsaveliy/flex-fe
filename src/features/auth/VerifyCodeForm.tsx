import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { USE_MOCK_API } from '@/api';
import type { VerificationChannel } from '@/api/types';
import { useResendCode, useVerifyContact } from '@/auth';
import { useTheme } from '@/theme';
import { Text, TextField, Touchable } from '@/ui';

import { AuthScreen } from './AuthScreen';
import { authErrorMessage, formatWait } from './authErrors';
import { useCountdown } from './useCountdown';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_MS = 30_000;
const MOCK_OTP = '000000';

function isChannel(value: string): value is VerificationChannel {
  return value === 'phone' || value === 'email';
}

/** подтверждение телефона и email одноразовым кодом — до первого входа */
export function VerifyCodeForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ verificationId: string; channels?: string }>();
  const steps = (params.channels ?? 'phone,email').split(',').filter(isChannel);
  const verify = useVerifyContact();
  const resend = useResendCode();
  const [index, setIndex] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_COOLDOWN_MS);
  const wait = useCountdown(resendAt);
  const channel = steps[index];

  const finish = () => router.dismissTo({ pathname: '/login', params: { registered: '1' } });

  useEffect(() => {
    if (!channel) finish();
  }, [channel]);

  const submit = (value: string) => {
    if (!channel) return;
    verify.mutate(
      { verificationId: params.verificationId, channel, code: value },
      {
        onSuccess: ({ remaining }) => {
          if (remaining.length === 0 || index + 1 >= steps.length) {
            finish();
            return;
          }
          setIndex((current) => current + 1);
          setCode('');
          setError(null);
          setResendAt(Date.now() + RESEND_COOLDOWN_MS);
        },
        onError: (failure) => {
          setCode('');
          setError(authErrorMessage(failure, t));
        },
      },
    );
  };

  const changeCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === CODE_LENGTH && !verify.isPending) submit(digits);
  };

  const resendCode = () => {
    if (!channel || wait > 0) return;
    resend.mutate({ verificationId: params.verificationId, channel });
    setResendAt(Date.now() + RESEND_COOLDOWN_MS);
  };

  if (!channel) return null;

  return (
    <AuthScreen title={t(`auth.verify.${channel}`)} subtitle={t(`auth.verify.${channel}Hint`)}>
      {steps.length > 1 ? (
        <Text variant="label" color="textMuted" uppercase>
          {t('auth.verify.step', { current: index + 1, total: steps.length })}
        </Text>
      ) : null}

      <TextField
        key={channel}
        label={t('auth.verify.code')}
        value={code}
        onChangeText={changeCode}
        icon="shield"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        autoFocus
        editable={!verify.isPending}
        error={error}
        hint={__DEV__ && USE_MOCK_API ? t('auth.verify.mockHint', { code: MOCK_OTP }) : undefined}
      />

      <View style={{ alignItems: 'center' }}>
        {wait > 0 ? (
          <Text variant="body" color="textMuted">
            {t('auth.verify.resendIn', { time: formatWait(wait) })}
          </Text>
        ) : (
          <Touchable accessibilityRole="button" onPress={resendCode} hitSlop={theme.spacing.sm}>
            <Text variant="bodyStrong" color="accent">
              {t('auth.verify.resend')}
            </Text>
          </Touchable>
        )}
      </View>
    </AuthScreen>
  );
}
