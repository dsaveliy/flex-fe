import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBalance, useIdempotencyKey, useLinkedCards, useTopUp } from '@/api';
import { parseAmount, sanitizeAmount } from '@/features/operations/amount';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { AccountSelect, SelectField } from '@/features/operations/SelectField';
import { SheetState } from '@/features/operations/SheetState';
import { useTheme } from '@/theme';
import { GlassButton, Icon, Text, TextField } from '@/ui';
import { formatMoney } from '@/utils/money';

/** пополнение своего счёта с привязанной карты другого банка; `to` — счёт карты */
export default function TopUpScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ to?: string }>();
  const balance = useBalance();
  const linked = useLinkedCards();
  const topUp = useTopUp();
  const [key, renewKey] = useIdempotencyKey();
  const [toId, setToId] = useState(params.to);
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

  const target = accounts.find((account) => account.id === toId) ?? accounts[0];
  const card = linked.data.find((item) => item.id === cardId) ?? linked.data[0];

  const submit = () => {
    if (!target || !card) return;
    const amountMinor = parseAmount(amount, target.amountDigits);
    if (!amountMinor) return setError(t('operations.errors.amountRequired'));
    setError(null);
    topUp.mutate(
      { body: { toAccountId: target.id, linkedCardId: card.id, amountMinor }, key },
      {
        onSuccess: (result) => {
          renewKey();
          setSuccess({ title: t('operations.topUp.success'), lines: [formatMoney(result.amount)] });
        },
        onError: (failure) => setError(operationErrorMessage(failure, t)),
      },
    );
  };

  return (
    <OperationSheet
      title={t('operations.topUp.title')}
      subtitle={t('operations.topUp.subtitle')}
      submitLabel={card ? t('operations.topUp.submit') : t('operations.topUp.link')}
      onSubmit={card ? submit : () => router.push('/link-card')}
      pending={topUp.isPending}
      error={error}
      success={success}
    >
      {card ? (
        <SelectField
          label={t('operations.topUp.card')}
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
      ) : (
        <Text variant="body" color="textMuted">
          {t('operations.topUp.linkFirst')}
        </Text>
      )}
      <AccountSelect
        label={t('operations.to')}
        accounts={accounts}
        value={target?.id}
        onChange={setToId}
      />
      {card ? (
        <TextField
          label={t('operations.amount')}
          placeholder="0"
          value={amount}
          onChangeText={(text) => setAmount(sanitizeAmount(text, target?.amountDigits ?? 2))}
          keyboardType="decimal-pad"
        />
      ) : (
        <GlassButton
          label={t('operations.topUp.link')}
          icon="plus"
          onPress={() => router.push('/link-card')}
        />
      )}
    </OperationSheet>
  );
}
