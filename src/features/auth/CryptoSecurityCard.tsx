import { useTranslation } from 'react-i18next';

import {
  useBiometryKind,
  useCryptoAccess,
  useCryptoSession,
  useLockCrypto,
  useSetBiometric,
} from '@/auth';
import { useTheme } from '@/theme';
import { GlassCard, Icon, ListRow, Toggle } from '@/ui';

/**
 * настройки входа в Crypto в профиле: Face ID (менять можно только при
 * открытом разделе — нужен crypto-токен) и ручное закрытие криптосессии
 */
export function CryptoSecurityCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const access = useCryptoAccess();
  const biometry = useBiometryKind().data ?? null;
  const { token } = useCryptoSession();
  const setBiometric = useSetBiometric();
  const lock = useLockCrypto();
  const status = access.data;
  const unlocked = Boolean(token);

  if (!status?.factorConfigured || (!biometry && !unlocked)) return null;

  return (
    <GlassCard
      contentStyle={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs }}
    >
      {biometry ? (
        <ListRow
          title={t('auth.account.biometric', { kind: t(`auth.biometry.${biometry}`) })}
          subtitle={t(unlocked ? 'auth.account.biometricHint' : 'auth.account.biometricHintLocked')}
          left={<Icon name="faceId" color={theme.colors.accent} />}
          right={
            <Toggle
              value={status.biometricEnabled}
              disabled={!unlocked || setBiometric.isPending}
              onValueChange={(enabled) => setBiometric.mutate(enabled)}
            />
          }
          showDivider={unlocked}
        />
      ) : null}
      {unlocked ? (
        <ListRow
          title={t('auth.account.lockCrypto')}
          subtitle={t('auth.account.lockCryptoHint')}
          left={<Icon name="lock" color={theme.colors.accent} />}
          onPress={() => lock.mutate()}
        />
      ) : null}
    </GlassCard>
  );
}
