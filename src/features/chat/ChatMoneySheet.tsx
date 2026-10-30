import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type AccountBalance,
  type ChatMessage,
  type TransferResult,
  useBalance,
  useChatMoney,
  useChatRoomInfo,
  useIdempotencyKey,
} from '@/api';
import { formatBalance, parseAmount, sanitizeAmount } from '@/features/operations/amount';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { SheetState } from '@/features/operations/SheetState';
import { AccountSelect } from '@/features/operations/SelectField';
import { Text, TextField } from '@/ui';
import { formatMoney } from '@/utils/money';

import { minorDigits } from './MoneyCard';

export type ChatMoneyMode = 'transfer' | 'request' | 'pay' | 'gift';

/** конверт — только из этих кошельков (как на сервере, chat_money.GIFT_ASSETS) */
const GIFT_ASSETS = ['BTC', 'USDT'];

type Params = {
  roomId: string;
  mode: ChatMoneyMode;
  /** оплата запроса: его id, сумма и валюта */
  requestId?: string;
  amount?: string;
  currency?: string;
};

/**
 * деньги собеседнику личного чата: перевести, запросить, оплатить запрос, отправить крипто-конверт.
 * карточка появится в ленте кадром с сервера — здесь только операция
 */
export function ChatMoneySheet() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<Params>();
  const mode: ChatMoneyMode = params.mode ?? 'transfer';
  const room = useChatRoomInfo(params.roomId);
  const balance = useBalance();
  const money = useChatMoney();
  const [key, renewKey] = useIdempotencyKey();
  const [accountId, setAccountId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OperationSuccess | null>(null);

  if (!balance.data) return <SheetState error={balance.isError} onRetry={() => balance.refetch()} />;

  const name = room?.title ?? '';
  const payAmount = mode === 'pay' && params.amount && params.currency
    ? { amountMinor: Number(params.amount), currency: params.currency }
    : null;
  const accounts = balance.data.accounts.filter((account: AccountBalance) =>
    mode === 'gift'
      ? GIFT_ASSETS.includes(account.currency)
      : account.kind === 'fiat' && (!payAmount || account.currency === payAmount.currency),
  );
  const source = accounts.find((account) => account.id === accountId) ?? accounts[0];

  const titles: Record<ChatMoneyMode, { title: string; subtitle: string; submit: string }> = {
    transfer: {
      title: t('chat.money.sheet.transferTitle'),
      subtitle: t('chat.money.sheet.transferSubtitle', { name }),
      submit: t('chat.money.sheet.submitTransfer'),
    },
    request: {
      title: t('chat.money.sheet.requestTitle'),
      subtitle: t('chat.money.sheet.requestSubtitle', { name }),
      submit: t('chat.money.sheet.submitRequest'),
    },
    pay: {
      title: t('chat.money.sheet.payTitle'),
      subtitle: payAmount
        ? t('chat.money.sheet.paySubtitle', {
            amount: formatMoney(payAmount, { minorUnitDigits: minorDigits(payAmount.currency) }),
          })
        : '',
      submit: t('chat.money.sheet.submitPay'),
    },
    gift: {
      title: t('chat.money.sheet.giftTitle'),
      subtitle: t('chat.money.sheet.giftSubtitle', { name }),
      submit: t('chat.money.sheet.submitGift'),
    },
  };

  const done = (result: TransferResult | ChatMessage) => {
    renewKey();
    const titleKey = {
      transfer: 'chat.money.sheet.successTransfer',
      request: 'chat.money.sheet.successRequest',
      pay: 'chat.money.sheet.successPay',
      gift: 'chat.money.sheet.successGift',
    }[mode];
    const lines = 'amount' in result ? [formatMoney(result.amount)] : undefined;
    setSuccess({ title: t(titleKey, { name }), lines });
  };

  const submit = () => {
    if (!source) return setError(t(mode === 'gift' ? 'chat.money.sheet.noCrypto' : 'chat.money.sheet.noAccounts'));
    const amountMinor = payAmount?.amountMinor ?? parseAmount(amount, source.amountDigits);
    if (!amountMinor) return setError(t('operations.errors.amountRequired'));
    setError(null);
    const note = comment.trim() || undefined;
    const onError = (failure: unknown) => setError(operationErrorMessage(failure, t));
    const options = { onSuccess: done, onError };

    if (mode === 'pay' && params.requestId) {
      money.mutate({ mode: 'pay', requestId: params.requestId, fromAccountId: source.id, key }, options);
    } else if (mode === 'request') {
      money.mutate(
        { mode: 'request', roomId: params.roomId, body: { amountMinor, currency: source.currency, comment: note } },
        options,
      );
    } else if (mode === 'gift') {
      money.mutate(
        { mode: 'gift', roomId: params.roomId, body: { fromAccountId: source.id, amountMinor, comment: note }, key },
        options,
      );
    } else {
      money.mutate(
        { mode: 'transfer', roomId: params.roomId, body: { fromAccountId: source.id, amountMinor, comment: note }, key },
        options,
      );
    }
  };

  const copy = titles[mode];

  return (
    <OperationSheet
      title={copy.title}
      subtitle={copy.subtitle}
      submitLabel={copy.submit}
      onSubmit={submit}
      pending={money.isPending}
      error={error}
      success={success}
    >
      {accounts.length > 0 ? (
        <AccountSelect
          label={t(mode === 'request' ? 'chat.money.sheet.to' : 'chat.money.sheet.from')}
          accounts={accounts}
          value={source?.id}
          onChange={setAccountId}
        />
      ) : (
        <Text variant="body" color="textMuted">
          {t(mode === 'gift' ? 'chat.money.sheet.noCrypto' : 'chat.money.sheet.noAccounts')}
        </Text>
      )}
      {mode !== 'pay' ? (
        <>
          <TextField
            label={t('operations.amount')}
            placeholder="0"
            value={amount}
            onChangeText={(text) => setAmount(sanitizeAmount(text, source?.amountDigits ?? 2))}
            keyboardType="decimal-pad"
            hint={
              source && mode !== 'request'
                ? t('operations.available', { amount: formatBalance(source) })
                : undefined
            }
          />
          <TextField
            label={t('chat.money.sheet.comment')}
            placeholder={t('chat.money.sheet.commentPlaceholder')}
            value={comment}
            onChangeText={setComment}
            maxLength={140}
          />
        </>
      ) : null}
    </OperationSheet>
  );
}
