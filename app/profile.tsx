import { useMutation, useQueryClient } from '@tanstack/react-query';
import { launchImageLibraryAsync, UIImagePickerPreferredAssetRepresentationMode } from 'expo-image-picker';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { api, queryKeys, useUser } from '@/api';
import { isValidEmail, normalizeEmail } from '@/auth/validation';
import { authErrorMessage } from '@/features/auth/authErrors';
import { useTheme } from '@/theme';
import { GlassButton, GlassCard, ProfileAvatar, Screen, Skeleton, Text, TextField } from '@/ui';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useUser();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);

  const changeEmail = useMutation({
    mutationFn: api.requestEmailChange,
    onSuccess: (_, address) => {
      setSentTo(address);
      setEmail('');
    },
    onError: (error) => setEmailError(authErrorMessage(error, t)),
  });
  const upload = useMutation({
    mutationFn: api.uploadAvatar,
    onSuccess: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user });
      queryClient.setQueryData(queryKeys.user, updatedUser);
      setAvatarSaved(true);
    },
    onError: (error) => setAvatarError(authErrorMessage(error, t)),
  });

  const chooseAvatar = async () => {
    setAvatarError(null);
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 0.85,
      });
      if (result.canceled) return;
      const [asset] = result.assets;
      setAvatarSaved(false);
      const sizeBytes = asset.fileSize ?? asset.file?.size ?? null;
      if (sizeBytes !== null && sizeBytes > MAX_AVATAR_BYTES) {
        setAvatarError(t('auth.errors.AVATAR_TOO_LARGE'));
        return;
      }
      upload.mutate({
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        sizeBytes,
        file: asset.file,
      });
    } catch {
      setAvatarError(t('profile.avatarPickerError'));
    }
  };

  const sendLink = (address: string) => {
    const normalized = normalizeEmail(address);
    if (!isValidEmail(normalized)) {
      setEmailError(t('auth.errors.emailFormat'));
      return;
    }
    setEmailError(null);
    changeEmail.mutate(normalized);
  };

  const refreshEmail = async () => {
    setEmailError(null);
    const result = await user.refetch();
    if (result.isError) setEmailError(authErrorMessage(result.error, t));
    else if (result.data?.email !== sentTo) setEmailError(t('auth.verify.emailLinkPending'));
  };

  return (
    <Screen keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: t('profile.title') }} />
      <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: theme.spacing.xl, gap: theme.spacing.md }}>
        {user.isPending ? <Skeleton height={160} /> : null}
        {user.isError && !user.data ? (
          <GlassButton label={t('profile.retry')} onPress={() => void user.refetch()} />
        ) : null}
        {user.data ? (
          <>
            <GlassCard contentStyle={{ alignItems: 'center', gap: theme.spacing.md }}>
              <ProfileAvatar user={user.data} size={88} />
              <GlassButton
                label={t(upload.isPending ? 'profile.uploadingAvatar' : 'profile.chooseAvatar')}
                onPress={upload.isPending ? undefined : chooseAvatar}
              />
              {avatarError || avatarSaved ? (
                <Text variant="caption" color={avatarError ? 'negative' : 'accent'}>
                  {avatarError ?? t('profile.avatarSaved')}
                </Text>
              ) : null}
            </GlassCard>
            <GlassCard contentStyle={{ gap: theme.spacing.md }}>
              <View style={{ gap: theme.spacing.xs }}>
                <Text variant="label" color="textMuted">{t('profile.currentEmail')}</Text>
                <Text variant="bodyStrong">{user.data.email}</Text>
              </View>
              <TextField
                label={t('profile.newEmail')}
                value={email}
                onChangeText={(value) => { setEmail(value); setEmailError(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                maxLength={254}
                error={emailError ?? undefined}
              />
              <GlassButton
                label={t(changeEmail.isPending ? 'profile.sendingLink' : 'profile.sendLink')}
                accent
                onPress={changeEmail.isPending ? undefined : () => sendLink(email)}
              />
              {sentTo && user.data.email !== sentTo ? (
                <>
                  <Text variant="caption" color="textMuted">
                    {t('profile.emailPending', { email: sentTo })}
                  </Text>
                  <GlassButton
                    label={t('profile.refreshEmail')}
                    onPress={user.isFetching ? undefined : refreshEmail}
                  />
                  <GlassButton
                    label={t('auth.verify.resendLink')}
                    onPress={changeEmail.isPending ? undefined : () => sendLink(sentTo)}
                  />
                </>
              ) : null}
              {sentTo && user.data.email === sentTo ? (
                <Text variant="caption" color="accent">{t('profile.emailUpdated')}</Text>
              ) : null}
            </GlassCard>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
