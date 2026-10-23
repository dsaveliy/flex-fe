import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type TransactionCategory, useCards, useIdempotencyKey, usePay } from '@/api';
import { parseAmount, sanitizeAmount } from '@/features/operations/amount';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { SelectField } from '@/features/operations/SelectField';
import { SheetState } from '@/features/operations/SheetState';
import { useTheme } from '@/theme';
import { Icon, TextField } from '@/ui';
import { formatMoney } from '@/utils/money';

const CATEGORIES: TransactionCategory[] = [
  'shopping',
  'cafe',
  'transport',
  'subscription',
  'other',
];

/**
 * оплата по QR-коду магазина — эмулятор терминала: деньги списываются с
 * выбранной карты, по категории начисляется кэшбэк (правила — на сервере)
 */
export default function PayScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const cards = useCards();
  const pay = usePay();
  const [key, renewKey] = useIdempotencyKey();
  const [cardId, setCardId] = useState<string>();
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('shopping');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OperationSuccess | null>(null);

  const active = cards.data?.filter((item) => item.status === 'active');
  if (!active) return <SheetState error={cards.isError} onRetry={() => cards.refetch()} />;
  const card = active.find((item) => item.id === cardId) ?? active[0];

  const submit = () => {
    if (!card) return;
    const amountMinor = parseAmount(amount, 2);
    if (!merchant.trim()) return setError(t('auth.errors.required'));
    if (!amountMinor) return setError(t('operations.errors.amountRequired'));
    setError(null);
    pay.mutate(
      {
        body: { cardId: card.id, merchant: merchant.trim(), amountMinor, category, channel: 'qr' },
        key,
      },
      {
        onSuccess: (result) => {
          renewKey();
          setSuccess({
            title: t('operations.pay.success', { merchant: merchant.trim() }),
            lines: [
              formatMoney(result.amount),
              ...(result.cashback.amountMinor > 0
                ? [t('operations.pay.cashback', { amount: formatMoney(result.cashback) })]
                : []),
            ],
          });
        },
        onError: (failure) => setError(operationErrorMessage(failure, t)),
      },
    );
  };

  return (
    <OperationSheet
      title={t('operations.pay.title')}
      subtitle={t('operations.pay.subtitle')}
      submitLabel={t('operations.pay.submit')}
      onSubmit={submit}
      pending={pay.isPending}
      error={error}
      success={success}
    >
      <SelectField
        label={t('operations.pay.card')}
        title={card ? `${card.productName} •• ${card.last4}` : undefined}
        subtitle={card ? formatMoney(card.balance) : undefined}
        left={<Icon name="cards" size={22} color={theme.colors.textMuted} />}
        options={active.map((item) => ({
          id: item.id,
          label: `${item.productName} •• ${item.last4} · ${formatMoney(item.balance)}`,
          checked: item.id === card?.id,
          onPress: () => setCardId(item.id),
        }))}
      />
      <TextField
        label={t('operations.pay.merchant')}
        placeholder={t('operations.pay.merchantPlaceholder')}
        value={merchant}
        onChangeText={setMerchant}
        maxLength={80}
      />
      <SelectField
        label={t('operations.pay.category')}
        title={t(`operations.categories.${category}`)}
        options={CATEGORIES.map((item) => ({
          id: item,
          label: t(`operations.categories.${item}`),
          checked: item === category,
          onPress: () => setCategory(item),
        }))}
      />
      <TextField
        label={t('operations.amount')}
        placeholder="0"
        value={amount}
        onChangeText={(text) => setAmount(sanitizeAmount(text, 2))}
        keyboardType="decimal-pad"
      />
    </OperationSheet>
  );
}
