import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { api, USE_MOCK_API } from '@/api';
import type { VerificationChannel } from '@/api/types';
import { useResendCode, useVerifyContact } from '@/auth';
import { useTheme } from '@/theme';
import { GlassButton, Text, TextField, Touchable } from '@/ui';

import { AuthNotice, AuthScreen } from './AuthScreen';
import { authErrorMessage, formatWait } from './authErrors';
import { useCountdown } from './useCountdown';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_MS = 30_000;
const MOCK_OTP = '000000';

function isChannel(value: string): value is VerificationChannel {
  return value === 'phone' || value === 'email';
}

/** Подтверждение телефона кодом и email по ссылке перед первым входом. */
export function VerifyCodeForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ verificationId: string; channels?: string; emailLink?: string }>();
  const steps = (params.channels ?? 'phone,email').split(',').filter(isChannel);
  const verify = useVerifyContact();
  const resend = useResendCode();
  const checkEmail = useMutation({ mutationFn: () => api.getVerificationStatus(params.verificationId) });
  const [index, setIndex] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_COOLDOWN_MS);
  const wait = useCountdown(resendAt);
  const channel = steps[index];
  const emailLink = channel === 'email' && params.emailLink === '1';

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
    if (!channel || wait > 0 || resend.isPending) return;
    setError(null);
    resend.mutate({ verificationId: params.verificationId, channel }, {
      onError: (failure) => setError(authErrorMessage(failure, t)),
    });
    setResendAt(Date.now() + RESEND_COOLDOWN_MS);
  };

  if (!channel) return null;

  return (
    <AuthScreen
      title={t(emailLink ? 'auth.verify.emailLinkTitle' : `auth.verify.${channel}`)}
      subtitle={t(emailLink ? 'auth.verify.emailLinkHint' : `auth.verify.${channel}Hint`)}
    >
      {steps.length > 1 ? (
        <Text variant="label" color="textMuted" uppercase>
          {t('auth.verify.step', { current: index + 1, total: steps.length })}
        </Text>
      ) : null}

      {emailLink ? (
        <>
          {error ? <AuthNotice text={error} tone="warning" /> : null}
          <GlassButton
            label={t('auth.verify.checkEmail')}
            onPress={checkEmail.isPending ? undefined : () => {
              setError(null);
              checkEmail.mutate(undefined, {
                onSuccess: ({ remaining }) => {
                  if (remaining.length === 0) finish();
                  else setError(t('auth.verify.emailLinkPending'));
                },
                onError: (failure) => setError(authErrorMessage(failure, t)),
              });
            }}
          />
          <GlassButton label={t('auth.verify.backToLogin')} onPress={() => router.dismissTo('/login')} />
        </>
      ) : (
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
      )}

      <View style={{ alignItems: 'center' }}>
        {wait > 0 ? (
          <Text variant="body" color="textMuted">
            {t('auth.verify.resendIn', { time: formatWait(wait) })}
          </Text>
        ) : (
          <Touchable accessibilityRole="button" onPress={resendCode} hitSlop={theme.spacing.sm}>
            <Text variant="bodyStrong" color="accent">
              {t(emailLink ? 'auth.verify.resendLink' : 'auth.verify.resend')}
            </Text>
          </Touchable>
        )}
      </View>
    </AuthScreen>
  );
}
