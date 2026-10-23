import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBalance, useIdempotencyKey, useLinkedCards, useWithdraw } from '@/api';
import { formatBalance, parseAmount, sanitizeAmount } from '@/features/operations/amount';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { AccountSelect, SelectField } from '@/features/operations/SelectField';
import { SheetState } from '@/features/operations/SheetState';
import { useTheme } from '@/theme';
import { Icon, Text, TextField } from '@/ui';
import { formatMoney } from '@/utils/money';

/** вывод со своего счёта на привязанную карту другого банка */
export default function WithdrawScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const balance = useBalance();
  const linked = useLinkedCards();
  const withdraw = useWithdraw();
  const [key, renewKey] = useIdempotencyKey();
  const [fromId, setFromId] = useState<string>();
  const [cardId, setCardId] = useState<string>();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OperationSuccess | null>(null);

  const accounts = balance.data?.accounts.filter((account) => account.kind === 'fiat');
  if (!accounts || !linked.data) {
    return (
      <SheetState
        error={balance.isError || linked.isError}
        onRetry={() => {
          void balance.refetch();
          void linked.refetch();
        }}
      />
    );
  }

  const source = accounts.find((account) => account.id === fromId) ?? accounts[0];
  const card = linked.data.find((item) => item.id === cardId) ?? linked.data[0];

  const submit = () => {
    if (!source || !card) return;
    const amountMinor = parseAmount(amount, source.amountDigits);
    if (!amountMinor) return setError(t('operations.errors.amountRequired'));
    setError(null);
    withdraw.mutate(
      { body: { fromAccountId: source.id, linkedCardId: card.id, amountMinor }, key },
      {
        onSuccess: (result) => {
          renewKey();
          setSuccess({
            title: t('operations.withdraw.success', { amount: formatMoney(result.amount) }),
          });
        },
        onError: (failure) => setError(operationErrorMessage(failure, t)),
      },
    );
  };

  return (
    <OperationSheet
      title={t('operations.withdraw.title')}
      subtitle={t('operations.withdraw.subtitle')}
      submitLabel={card ? t('operations.withdraw.submit') : t('operations.topUp.link')}
      onSubmit={card ? submit : () => router.push('/link-card')}
      pending={withdraw.isPending}
      error={error}
      success={success}
    >
      <AccountSelect
        label={t('operations.from')}
        accounts={accounts}
        value={source?.id}
        onChange={setFromId}
      />
      {card ? (
        <>
          <SelectField
            label={t('operations.withdraw.card')}
            title={`${card.brand === 'visa' ? 'Visa' : 'Mastercard'} •• ${card.last4}`}
            subtitle={card.holderName}
            left={<Icon name="cards" size={22} color={theme.colors.textMuted} />}
            options={[
              ...linked.data.map((item) => ({
                id: item.id,
                label: `${item.brand === 'visa' ? 'Visa' : 'Mastercard'} •• ${item.last4}`,
                checked: item.id === card.id,
                onPress: () => setCardId(item.id),
              })),
              {
                id: 'link',
                label: t('operations.topUp.link'),
                onPress: () => router.push('/link-card'),
              },
            ]}
          />
          <TextField
            label={t('operations.amount')}
            placeholder="0"
            value={amount}
            onChangeText={(text) => setAmount(sanitizeAmount(text, source?.amountDigits ?? 2))}
            keyboardType="decimal-pad"
            hint={source ? t('operations.available', { amount: formatBalance(source) }) : undefined}
          />
        </>
      ) : (
        <Text variant="body" color="textMuted">
          {t('operations.topUp.linkFirst')}
        </Text>
      )}
    </OperationSheet>
  );
}
