import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBalance, useEarnProducts, useSubscribeEarn } from '@/api';
import { formatCoinAmount } from '@/features/crypto/convertRate';
import { formatBalance, parseAmount, sanitizeAmount } from '@/features/operations/amount';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { SheetState } from '@/features/operations/SheetState';
import { TextField } from '@/ui';
import { formatPercent } from '@/utils/format';

/** подключение продукта Earn: монеты с кошелька переходят на счёт Earn и приносят доход */
export default function EarnSubscribeScreen() {
  const { t } = useTranslation();
  const { product: productId } = useLocalSearchParams<{ product: string }>();
  const products = useEarnProducts();
  const balance = useBalance();
  const subscribe = useSubscribeEarn();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OperationSuccess | null>(null);

  const product = products.data?.find((item) => item.id === productId);
  if (!product || !balance.data) {
    return (
      <SheetState
        error={products.isError || balance.isError}
        onRetry={() => {
          void products.refetch();
          void balance.refetch();
        }}
      />
    );
  }

  const wallet = balance.data.accounts.find(
    (account) => account.currency === product.symbol && account.kind === 'crypto',
  );
  const digits = wallet?.amountDigits ?? 8;
  const term =
    product.termDays === null
      ? t('crypto.earn.flexible')
      : t('crypto.earn.locked', { days: product.termDays });

  const submit = () => {
    const amountMinor = parseAmount(amount, digits);
    if (!amountMinor) return setError(t('operations.errors.amountRequired'));
    setError(null);
    subscribe.mutate(
      { productId: product.id, amountMinor },
      {
        onSuccess: (position) =>
          setSuccess({
            title: t('operations.earn.success', {
              amount: `${formatCoinAmount(position.principal.amountMinor / 10 ** digits)} ${product.symbol}`,
            }),
            lines: [
              t('operations.earn.subtitle', {
                apy: formatPercent(product.apyPercent, { withSign: false, digits: 1 }),
                term,
              }),
            ],
          }),
        onError: (failure) => setError(operationErrorMessage(failure, t)),
      },
    );
  };

  return (
    <OperationSheet
      title={t('operations.earn.title', { symbol: product.symbol })}
      subtitle={t('operations.earn.subtitle', {
        apy: formatPercent(product.apyPercent, { withSign: false, digits: 1 }),
        term,
      })}
      submitLabel={t('operations.earn.submit')}
      onSubmit={submit}
      pending={subscribe.isPending}
      error={error}
      success={success}
    >
      <TextField
        label={t('operations.amount')}
        placeholder={String(product.minAmount)}
        value={amount}
        onChangeText={(text) => setAmount(sanitizeAmount(text, digits))}
        keyboardType="decimal-pad"
        hint={[
          t('crypto.earn.min', { amount: product.minAmount, symbol: product.symbol }),
          wallet ? t('operations.available', { amount: formatBalance(wallet) }) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      />
    </OperationSheet>
  );
}
