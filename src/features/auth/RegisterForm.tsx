import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type TextInput, View } from 'react-native';

import { isApiError } from '@/api';
import {
  PASSWORD_MIN_LENGTH,
  type RegisterErrors,
  type RegisterField,
  useRegister,
  validateRegistration,
} from '@/auth';
import { useTheme } from '@/theme';
import { GlassButton, Text, TextField } from '@/ui';

import { AuthLink, AuthScreen } from './AuthScreen';
import { authErrorMessage } from './authErrors';

/** ошибки сервера, которые относятся к конкретному полю */
const FIELD_BY_CODE: Record<string, RegisterField> = {
  PHONE_TAKEN: 'phone',
  PHONE_INVALID: 'phone',
  EMAIL_TAKEN: 'email',
  EMAIL_INVALID: 'email',
  PASSWORD_WEAK: 'password',
  PASSWORD_LEAKED: 'password',
};

/** регистрация (роль Basic): токены не выдаются, дальше подтверждение кодом и вход */
export function RegisterForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const register = useRegister();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [values, setValues] = useState<Record<RegisterField, string>>({
    phone: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const change = (field: RegisterField) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const fieldError = (field: RegisterField) => {
    const value = errors[field];
    return value ? t(value) : null;
  };

  const submit = () => {
    const found = validateRegistration(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    register.mutate(
      { phone: values.phone, email: values.email, password: values.password },
      {
        onSuccess: ({ verificationId, channels }) =>
          router.push({
            pathname: '/verify',
            params: { verificationId, channels: channels.join(',') },
          }),
        onError: (failure) => {
          const field = isApiError(failure) ? FIELD_BY_CODE[failure.code] : undefined;
          if (field && isApiError(failure)) setErrors({ [field]: `auth.errors.${failure.code}` });
          else setFormError(authErrorMessage(failure, t));
        },
      },
    );
  };

  return (
    <AuthScreen
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <AuthLink
          question={t('auth.register.haveAccount')}
          action={t('auth.register.login')}
          onPress={() => router.back()}
        />
      }
    >
      <View style={{ gap: theme.spacing.lg }}>
        <TextField
          label={t('auth.register.phone')}
          placeholder={t('auth.register.phonePlaceholder')}
          value={values.phone}
          onChangeText={change('phone')}
          icon="user"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          error={fieldError('phone')}
        />
        <TextField
          ref={emailRef}
          label={t('auth.register.email')}
          placeholder={t('auth.register.emailPlaceholder')}
          value={values.email}
          onChangeText={change('email')}
          icon="document"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={fieldError('email')}
        />
        <TextField
          ref={passwordRef}
          label={t('auth.register.password')}
          value={values.password}
          onChangeText={change('password')}
          icon="lock"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          hint={t('auth.register.passwordHint', { min: PASSWORD_MIN_LENGTH })}
          error={fieldError('password')}
        />
        <TextField
          ref={confirmRef}
          label={t('auth.register.confirm')}
          value={values.confirm}
          onChangeText={change('confirm')}
          icon="lock"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={fieldError('confirm')}
        />
      </View>

      {formError ? (
        <Text variant="caption" color="negative">
          {formError}
        </Text>
      ) : null}

      <GlassButton
        accent
        label={t('auth.register.submit')}
        onPress={register.isPending ? undefined : submit}
        size={theme.sizes.touchTarget + theme.spacing.xs}
        style={{ alignSelf: 'stretch' }}
      />
    </AuthScreen>
  );
}
