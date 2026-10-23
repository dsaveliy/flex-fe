import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useCryptoAccess, useCryptoSession, useRoleSync } from '@/auth';
import { useTheme } from '@/theme';
import { ErrorState, Skeleton } from '@/ui';

import { CryptoPinSetup } from './CryptoPinSetup';
import { CryptoUnlock } from './CryptoUnlock';
import { KycPrompt } from './KycPrompt';

/**
 * Уровень 2: содержимое криптораздела видно только с crypto-токеном.
 * Basic → предложение KYC, нет PIN → настройка, иначе ввод фактора
 */
export function CryptoGate({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const crypto = useCryptoSession();
  const access = useCryptoAccess();
  useRoleSync(access.data);

  if (crypto.token) return children;

  if (access.isPending) {
    return (
      <View style={{ alignItems: 'center', gap: theme.spacing.lg, paddingTop: theme.spacing.xxl }}>
        <Skeleton width={64} height={64} radius={32} />
        <Skeleton width={200} height={28} />
        <Skeleton width={260} height={18} />
      </View>
    );
  }

  if (access.isError) return <ErrorState onRetry={() => void access.refetch()} />;

  const status = access.data;
  if (status.role !== 'pro' || status.kycStatus !== 'approved') {
    return <KycPrompt status={status.kycStatus} />;
  }
  if (!status.factorConfigured) return <CryptoPinSetup />;
  return <CryptoUnlock status={status} />;
}
