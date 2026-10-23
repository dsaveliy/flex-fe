import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBalance, useExchange, useIdempotencyKey, useMarkets } from '@/api';
import { formatBalance, parseAmount, sanitizeAmount } from '@/features/operations/amount';
import {
  CRYPTO_CURRENCIES,
  currencyDigits,
  FIAT_CURRENCIES,
  isCrypto,
  rateByn,
} from '@/features/operations/currencies';
import { OperationSheet, type OperationSuccess } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { AccountSelect, SelectField } from '@/features/operations/SelectField';
import { SheetState } from '@/features/operations/SheetState';
import { formatCoinAmount } from '@/features/crypto/convertRate';
import { useTheme } from '@/theme';
import { CoinBadge, Text, TextField } from '@/ui';
import { formatMoney } from '@/utils/money';

const EXCHANGE_FEE = 0.01;

type Params = {
  /** `fiat` — обмен валют (Уровень 1), `crypto` — купить, продать, обменять монеты (crypto-токен) */
  mode?: 'fiat' | 'crypto';
  /** валюта списания и зачисления, например `BYN` → `BTC` */
  from?: string;
  to?: string;
  amount?: string;
};

/**
 * обмен между своими счетами по текущему курсу. если счёта в валюте
 * зачисления ещё нет, он откроется при обмене. открывается с Home («Обменять»),
 * из Trade (купить, продать) и Convert раздела Crypto
 */
export default function ExchangeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<Params>();
  const crypto = params.mode === 'crypto';
  const balance = useBalance();
  const markets = useMarkets();
  const exchange = useExchange();
  const [key, renewKey] = useIdempotencyKey();
  const [fromId, setFromId] = useState<string>();
  const [toCurrency, setToCurrency] = useState(params.to);
  const [amount, setAmount] = useState(params.amount ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OperationSuccess | null>(null);

  const allowed: readonly string[] = crypto
    ? [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES]
    : FIAT_CURRENCIES;
  const accounts = balance.data?.accounts.filter((account) => allowed.includes(account.currency));
  if (!accounts || !markets.data) {
    return (
      <SheetState
        error={balance.isError || markets.isError}
        onRetry={() => {
          void balance.refetch();
          void markets.refetch();
        }}
      />
    );
  }

  const source =
    accounts.find((account) => account.id === fromId) ??
    accounts.find((account) => account.currency === params.from) ??
    accounts[0];
  const target = toCurrency ?? allowed.find((currency) => currency !== source?.currency);
  const targetAccount = accounts.find((account) => account.currency === target);

  const fromRate = source ? rateByn(source.currency, markets.data) : null;
  const toRate = target ? rateByn(target, markets.data) : null;
  const rate = fromRate && toRate ? fromRate / toRate : null;
  const amountMinor = source ? parseAmount(amount, source.amountDigits) : null;
  const receive =
    rate && amountMinor && source
      ? (amountMinor / 10 ** source.amountDigits) * rate * (1 - EXCHANGE_FEE)
      : 0;

  // фиат → монета — покупка, монета → фиат — продажа, остальное — обмен
  const side =
    crypto && source && target && isCrypto(source.currency) !== isCrypto(target)
      ? isCrypto(target)
        ? 'buy'
        : 'sell'
      : 'exchange';
  const title =
    side === 'buy'
      ? t('operations.trade.buyTitle', { symbol: target })
      : side === 'sell'
        ? t('operations.trade.sellTitle', { symbol: source?.currency })
        : t('operations.exchange.title');
  const submitLabel =
    side === 'exchange' ? t('operations.exchange.submit') : t(`operations.trade.${side}`);
  // курс — за единицу более дорогой валюты: «1 BTC ≈ 248 000 BYN», а не «1 BYN ≈ 0,000004 BTC»
  const [rateFrom, rateTo, rateValue] =
    rate && rate < 1 ? [target, source?.currency, 1 / rate] : [source?.currency, target, rate ?? 0];

  const formatAmount = (value: number, currency: string) =>
    isCrypto(currency)
      ? `${formatCoinAmount(value)} ${currency}`
      : formatMoney({ amountMinor: Math.round(value * 100), currency });

  const submit = () => {
    if (!source || !target) return;
    if (!amountMinor) return setError(t('operations.errors.amountRequired'));
    if (source.currency === target) return setError(t('operations.errors.SAME_CURRENCY'));
    setError(null);
    exchange.mutate(
      {
        body: { fromAccountId: source.id, toAccountId: targetAccount?.id, amountMinor },
        toCurrency: target,
        key,
        crypto,
      },
      {
        onSuccess: (result) => {
          renewKey();
          const digits = currencyDigits(result.toAmount.currency);
          setSuccess({
            title: t('operations.exchange.success', {
              amount: formatAmount(
                result.toAmount.amountMinor / 10 ** digits,
                result.toAmount.currency,
              ),
            }),
            lines: [
              formatAmount(
                result.fromAmount.amountMinor / 10 ** currencyDigits(result.fromAmount.currency),
                result.fromAmount.currency,
              ),
              t('operations.fee', {
                amount: formatAmount(result.fee.amountMinor / 10 ** digits, result.fee.currency),
              }),
            ],
          });
        },
        onError: (failure) => setError(operationErrorMessage(failure, t)),
      },
    );
  };

  return (
    <OperationSheet
      title={title}
      subtitle={crypto ? t('operations.trade.subtitle') : t('operations.exchange.subtitle')}
      submitLabel={submitLabel}
      onSubmit={submit}
      pending={exchange.isPending}
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
        label={t('operations.amount')}
        placeholder="0"
        value={amount}
        onChangeText={(text) => setAmount(sanitizeAmount(text, source?.amountDigits ?? 2))}
        keyboardType="decimal-pad"
        hint={source ? t('operations.available', { amount: formatBalance(source) }) : undefined}
      />
      <SelectField
        label={t('operations.to')}
        title={targetAccount?.name ?? target}
        subtitle={
          targetAccount
            ? formatBalance(targetAccount)
            : target
              ? t('operations.newAccount', { currency: target })
              : undefined
        }
        left={
          target ? (
            <CoinBadge
              symbol={target}
              color={
                targetAccount?.color ??
                markets.data.find((asset) => asset.symbol === target)?.badgeColor ??
                theme.colors.accent
              }
              size={theme.sizes.iconButton}
            />
          ) : undefined
        }
        options={allowed
          .filter((currency) => currency !== source?.currency)
          .map((currency) => {
            const existing = accounts.find((account) => account.currency === currency);
            return {
              id: currency,
              label: existing
                ? `${existing.name} · ${formatBalance(existing)}`
                : t('operations.newAccount', { currency }),
              checked: currency === target,
              onPress: () => setToCurrency(currency),
            };
          })}
      />
      {rate && source && target ? (
        <Text variant="body" color="textMuted" align="center">
          {receive > 0 ? `≈ ${formatAmount(receive, target)}\n` : ''}
          {t('operations.rate', {
            from: rateFrom,
            rate: formatCoinAmount(rateValue),
            to: rateTo,
          })}
        </Text>
      ) : null}
    </OperationSheet>
  );
}
