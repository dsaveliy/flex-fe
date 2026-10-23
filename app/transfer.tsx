import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBalance, useIdempotencyKey, useTransfer } from '@/api';
import { formatBalance, parseAmount, sanitizeAmount } from '@/features/operations/amount';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { SheetState } from '@/features/operations/SheetState';
import { AccountSelect } from '@/features/operations/SelectField';
import { TextField } from '@/ui';
import { formatMoney } from '@/utils/money';

/** перевод клиенту Flex по номеру телефона; `from` — счёт карты, с которой открыли */
export default function TransferScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ from?: string }>();
  const balance = useBalance();
  const transfer = useTransfer();
  const [key, renewKey] = useIdempotencyKey();
  const [fromId, setFromId] = useState(params.from);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OperationSuccess | null>(null);

  const accounts = balance.data?.accounts.filter((account) => account.kind === 'fiat');
  if (!accounts) return <SheetState error={balance.isError} onRetry={() => balance.refetch()} />;

  const source = accounts.find((account) => account.id === fromId) ?? accounts[0];

  const submit = () => {
    if (!source) return;
    const amountMinor = parseAmount(amount, source.amountDigits);
    if (!phone.trim()) return setError(t('operations.errors.phoneRequired'));
    if (!amountMinor) return setError(t('operations.errors.amountRequired'));
    setError(null);
    transfer.mutate(
      {
        body: {
          fromAccountId: source.id,
          recipientPhone: phone,
          amountMinor,
          comment: comment.trim() || undefined,
        },
        key,
      },
      {
        onSuccess: (result) => {
          renewKey();
          setSuccess({
            title: t('operations.transfer.success', { name: result.recipientName }),
            lines: [formatMoney(result.amount)],
          });
        },
        onError: (failure) => setError(operationErrorMessage(failure, t)),
      },
    );
  };

  return (
    <OperationSheet
      title={t('operations.transfer.title')}
      subtitle={t('operations.transfer.subtitle')}
      submitLabel={t('operations.transfer.submit')}
      onSubmit={submit}
      pending={transfer.isPending}
      error={error}
      success={success}
    >
      <AccountSelect
        label={t('operations.from')}
        accounts={accounts}
        value={source?.id}
        onChange={setFromId}
      />
      <TextField
        label={t('operations.transfer.phone')}
        placeholder={t('operations.transfer.phonePlaceholder')}
        value={phone}
        onChangeText={setPhone}
        icon="user"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <TextField
        label={t('operations.amount')}
        placeholder="0"
        value={amount}
        onChangeText={(text) => setAmount(sanitizeAmount(text, source?.amountDigits ?? 2))}
        keyboardType="decimal-pad"
        hint={source ? t('operations.available', { amount: formatBalance(source) }) : undefined}
      />
      <TextField
        label={t('operations.transfer.comment')}
        placeholder={t('operations.transfer.commentPlaceholder')}
        value={comment}
        onChangeText={setComment}
        maxLength={140}
      />
    </OperationSheet>
  );
}
