import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import type { KycStatus } from '@/api/types';
import { useSubmitKyc } from '@/auth';
import { useTheme } from '@/theme';
import { GlassButton, GlassCard, Text } from '@/ui';

import { authErrorMessage } from './authErrors';
import { GateMessage } from './GateMessage';

/**
 * Basic-клиент на вкладке Crypto: вместо входа — предложение пройти KYC.
 * в mock «администратор» одобряет заявку через несколько секунд
 */
export function KycPrompt({ status }: { status: KycStatus }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const submit = useSubmitKyc();

  if (status === 'pending') {
    return (
      <GlassCard contentStyle={{ padding: theme.spacing.xxl }}>
        <GateMessage
          icon="shield"
          title={t('auth.crypto.kycPendingTitle')}
          text={t('auth.crypto.kycPendingText')}
        >
          <ActivityIndicator color={theme.colors.accent} style={{ marginTop: theme.spacing.sm }} />
        </GateMessage>
      </GlassCard>
    );
  }

  return (
    <GlassCard contentStyle={{ padding: theme.spacing.xxl, gap: theme.spacing.xl }}>
      <GateMessage
        icon="shield"
        title={t(status === 'rejected' ? 'auth.crypto.kycRejectedTitle' : 'auth.crypto.kycTitle')}
        text={t('auth.crypto.kycText')}
      />
      {submit.isError ? (
        <Text variant="caption" color="negative" align="center">
          {authErrorMessage(submit.error, t)}
        </Text>
      ) : null}
      <GlassButton
        accent
        label={t(status === 'rejected' ? 'auth.crypto.kycRetry' : 'auth.crypto.kycSubmit')}
        onPress={submit.isPending ? undefined : () => submit.mutate()}
        size={theme.sizes.touchTarget + theme.spacing.xs}
        style={{ alignSelf: 'stretch' }}
      />
    </GlassCard>
  );
}
