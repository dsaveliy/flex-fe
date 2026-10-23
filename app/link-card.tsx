import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLinkCard } from '@/api';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { Text, TextField } from '@/ui';

/** «4111111111111111» → «4111 1111 1111 1111» */
const groupPan = (text: string) =>
  text
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/** «1230» → «12/30» */
const formatExpiry = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

/** привязка карты другого банка для пополнения; принимаются только тестовые номера */
export default function LinkCardScreen() {
  const { t } = useTranslation();
  const link = useLinkCard();
  const [pan, setPan] = useState('');
  const [expiry, setExpiry] = useState('');
  const [holder, setHolder] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OperationSuccess | null>(null);

  const submit = () => {
    if (pan.replace(/\D/g, '').length < 13 || expiry.length !== 5 || holder.trim().length < 2) {
      return setError(t('auth.errors.required'));
    }
    setError(null);
    link.mutate(
      { pan, expiry, holderName: holder.trim() },
      {
        onSuccess: (card) =>
          setSuccess({ title: t('operations.link.success', { last4: card.last4 }) }),
        onError: (failure) => setError(operationErrorMessage(failure, t)),
      },
    );
  };

  return (
    <OperationSheet
      title={t('operations.link.title')}
      subtitle={t('operations.link.subtitle')}
      submitLabel={t('operations.link.submit')}
      onSubmit={submit}
      pending={link.isPending}
      error={error}
      success={success}
    >
      <TextField
        label={t('operations.link.pan')}
        placeholder={t('operations.link.panPlaceholder')}
        value={pan}
        onChangeText={(text) => setPan(groupPan(text))}
        icon="cards"
        keyboardType="number-pad"
        autoComplete="cc-number"
      />
      <TextField
        label={t('operations.link.expiry')}
        placeholder={t('operations.link.expiryPlaceholder')}
        value={expiry}
        onChangeText={(text) => setExpiry(formatExpiry(text))}
        keyboardType="number-pad"
        autoComplete="cc-exp"
      />
      <TextField
        label={t('operations.link.holder')}
        placeholder={t('operations.link.holderPlaceholder')}
        value={holder}
        onChangeText={(text) => setHolder(text.toUpperCase())}
        autoCapitalize="characters"
        autoComplete="cc-name"
      />
      <Text variant="caption" color="textMuted">
        {t('operations.link.testCards')}
      </Text>
    </OperationSheet>
  );
}
