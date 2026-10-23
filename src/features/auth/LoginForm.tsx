import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type TextInput, View } from 'react-native';

import { isApiError, USE_MOCK_API } from '@/api';
import { useLogin, useSession } from '@/auth';
import { useTheme } from '@/theme';
import { Chip, GlassButton, Text, TextField } from '@/ui';

import { AuthLink, AuthNotice, AuthScreen } from './AuthScreen';
import { authErrorMessage } from './authErrors';

const DEMO_ACCOUNTS = ['pro@flex.by', 'basic@flex.by'];
const DEMO_PASSWORD = 'FlexDemo2026!';

/**
 * Уровень 1: телефон или email + пароль. после успеха `Stack.Protected` в
 * корневом layout сам переводит на вкладки
 */
export function LoginForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ registered?: string }>();
  const { signOutReason } = useSession();
  const login = useLogin();
  const passwordRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!identifier.trim() || !password) {
      setError(t('auth.errors.required'));
      return;
    }
    setError(null);
    login.mutate(
      { identifier, password },
      {
        onError: (failure) => {
          if (isApiError(failure, 'CONTACT_NOT_VERIFIED')) {
            const channels = failure.details?.channels;
            router.push({
              pathname: '/verify',
              params: {
                verificationId: String(failure.details?.verificationId ?? ''),
                channels: Array.isArray(channels) ? channels.join(',') : 'phone,email',
              },
            });
            return;
          }
          setError(authErrorMessage(failure, t));
        },
      },
    );
  };

  const notice = params.registered
    ? { text: t('auth.login.registered'), tone: 'info' as const }
    : signOutReason === 'revoked' || signOutReason === 'expired'
      ? { text: t(`auth.reason.${signOutReason}`), tone: 'warning' as const }
      : null;

  return (
    <AuthScreen
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <AuthLink
          question={t('auth.login.noAccount')}
          action={t('auth.login.register')}
          onPress={() => router.push('/register')}
        />
      }
    >
      {notice ? <AuthNotice text={notice.text} tone={notice.tone} /> : null}

      <View style={{ gap: theme.spacing.lg }}>
        <TextField
          label={t('auth.login.identifier')}
          placeholder={t('auth.login.identifierPlaceholder')}
          value={identifier}
          onChangeText={setIdentifier}
          icon="user"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label={t('auth.login.password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          icon="lock"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={error}
        />
      </View>

      <GlassButton
        accent
        label={login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
        onPress={login.isPending ? undefined : submit}
        size={theme.sizes.touchTarget + theme.spacing.xs}
        style={{ alignSelf: 'stretch' }}
      />

      {__DEV__ && USE_MOCK_API ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted" uppercase>
            {t('auth.login.demoTitle')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {DEMO_ACCOUNTS.map((account) => (
              <Chip
                key={account}
                label={account}
                selected={identifier === account}
                onPress={() => {
                  setIdentifier(account);
                  setPassword(DEMO_PASSWORD);
                  setError(null);
                }}
              />
            ))}
          </View>
          <Text variant="caption" color="textMuted">
            {t('auth.login.demoHint', { password: DEMO_PASSWORD })}
          </Text>
        </View>
      ) : null}
    </AuthScreen>
  );
}
