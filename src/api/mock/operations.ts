import { palette } from '@/theme/palette';
import { money } from '@/utils/money';

import type {
  AccountBalance,
  BalanceSummary,
  BankCard,
  BankCardDetails,
  EarnPosition,
  EarnSubscribeRequest,
  ExchangeRequest,
  ExchangeResult,
  IssueCardRequest,
  LinkCardRequest,
  LinkedCard,
  OpenedAccount,
  OperationResult,
  PaymentRequest,
  PaymentResult,
  TopUpRequest,
  Transaction,
  TransactionCategory,
  TransferRequest,
  TransferResult,
  WithdrawalRequest,
} from '../types';
import { respond } from './delay';
import { mockEarnProducts } from './crypto.fixtures';
import { mockBalance, mockCardDetails, mockCards, mockRates, mockTransactions } from './fixtures';
import { mockMarkets } from './markets.fixtures';
import { requireAccess, requireCrypto } from './auth/guards';
import { fail } from './auth/tokens';

/**
 * «сервер» для операций с виртуальными деньгами: балансы, карты и операции
 * меняются в памяти до перезапуска приложения. правила и коды ошибок — как у
 * flex-be (docs/api.md §6, §8–10), чтобы экраны вели себя одинаково с mock и с сервером
 */

const MAX_CARDS = 6;
const EXCHANGE_FEE = 0.01;
const TOPUP_MAX_MINOR = 1_000_000;
// тестовые номера платёжных шлюзов — как FLEX_LINKED_CARDS_TEST_ONLY на сервере
const TEST_PANS = new Set([
  '4111111111111111',
  '4242424242424242',
  '4012888888881881',
  '4000056655665556',
  '5555555555554444',
  '5105105105105100',
  '5200828282828210',
  '4000000000000002',
  '4000000000009995',
]);
const DECLINES: Record<string, string> = {
  '0002': 'CARD_DECLINED',
  '9995': 'ISSUER_INSUFFICIENT_FUNDS',
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const state = {
  balance: clone(mockBalance),
  cards: clone(mockCards),
  details: clone(mockCardDetails),
  transactions: clone(mockTransactions),
  linked: [] as LinkedCard[],
  idempotent: new Map<string, unknown>(),
  sequence: 0,
};

/**
 * копии, а не ссылки: React Query сравнивает новый ответ с прежним, и мутация
 * общего объекта выглядела бы для него как «ничего не изменилось»
 */
export const mockOperationsState = {
  balance: (): BalanceSummary => clone(state.balance),
  cards: (): BankCard[] => clone(state.cards),
  details: (): BankCardDetails[] => clone(state.details),
  transactions: (): Transaction[] => clone(state.transactions),
};

const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${++state.sequence}`;

/** BYN за 1 единицу валюты: у открытых счетов — как в фикстуре, у новых — по рынку */
function rateByn(currency: string): number {
  const account = state.balance.accounts.find((item) => item.currency === currency);
  if (account && account.amount.amountMinor > 0) {
    return (
      (account.valueBase.amountMinor / account.amount.amountMinor) *
      10 ** (account.amountDigits - 2)
    );
  }
  const known = (mockRates.rates as Record<string, number>)[currency];
  if (known) return known;
  const asset = mockMarkets.find((item) => item.symbol === currency);
  if (!asset) fail(503, 'RATE_UNAVAILABLE');
  return asset.quoteCurrency === 'BYN' ? asset.price : asset.price * mockRates.rates.USD;
}

function revalue(): void {
  for (const account of state.balance.accounts) {
    const major = account.amount.amountMinor / 10 ** account.amountDigits;
    account.valueBase = money(Math.round(major * rateByn(account.currency) * 100), 'BYN');
  }
  const total = state.balance.accounts.reduce((sum, item) => sum + item.valueBase.amountMinor, 0);
  state.balance.total = money(total, 'BYN');
}

function account(id: string): AccountBalance {
  const found = state.balance.accounts.find((item) => item.id === id);
  if (!found) fail(404, 'account_not_found');
  return found;
}

function debit(target: AccountBalance, amountMinor: number): void {
  if (target.amount.amountMinor < amountMinor) fail(409, 'INSUFFICIENT_FUNDS');
  target.amount = money(target.amount.amountMinor - amountMinor, target.currency);
}

function credit(target: AccountBalance, amountMinor: number): void {
  target.amount = money(target.amount.amountMinor + amountMinor, target.currency);
}

/** в фикстуре рублёвый счёт один на все карты: операции по нему видны в ленте первой карты */
function record(
  target: AccountBalance,
  merchant: string,
  category: TransactionCategory,
  amountMinor: number,
  direction: Transaction['direction'],
): void {
  const card = state.cards[0];
  if (target.currency !== 'BYN' || !card) return;
  card.balance = money(
    card.balance.amountMinor + (direction === 'incoming' ? amountMinor : -amountMinor),
    'BYN',
  );
  state.transactions.unshift({
    id: nextId('tx'),
    cardId: card.id,
    merchant,
    category,
    direction,
    amount: money(amountMinor, 'BYN'),
    occurredAt: new Date().toISOString(),
  });
}

/** повтор с тем же ключом возвращает прежний результат, как Idempotency-Key на сервере */
function once<T>(key: string, run: () => T): T {
  if (state.idempotent.has(key)) return state.idempotent.get(key) as T;
  const result = run();
  state.idempotent.set(key, result);
  return result;
}

function luhn(pan: string): boolean {
  let sum = 0;
  [...pan].reverse().forEach((char, index) => {
    let digit = Number(char);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  });
  return sum % 10 === 0;
}

function convertAmount(from: AccountBalance, to: AccountBalance, amountMinor: number) {
  if (from.currency === to.currency) fail(422, 'SAME_CURRENCY');
  const rate = rateByn(from.currency) / rateByn(to.currency);
  const gross = (amountMinor / 10 ** from.amountDigits) * rate;
  const fee = gross * EXCHANGE_FEE;
  const toMinor = Math.floor((gross - fee) * 10 ** to.amountDigits);
  if (toMinor <= 0) fail(422, 'AMOUNT_TOO_SMALL');
  return { rate, toMinor, feeMinor: Math.round(fee * 10 ** to.amountDigits) };
}

function swap(body: ExchangeRequest, label: (from: string, to: string) => string): ExchangeResult {
  const from = account(body.fromAccountId);
  const to = account(body.toAccountId);
  const { rate, toMinor, feeMinor } = convertAmount(from, to, body.amountMinor);
  debit(from, body.amountMinor);
  credit(to, toMinor);
  record(from, label(from.currency, to.currency), 'other', body.amountMinor, 'outgoing');
  record(to, label(from.currency, to.currency), 'other', toMinor, 'incoming');
  revalue();
  return {
    transactionId: nextId('tx'),
    status: 'completed',
    fromAmount: money(body.amountMinor, from.currency),
    toAmount: money(toMinor, to.currency),
    fee: money(feeMinor, to.currency),
    rate,
    createdAt: new Date().toISOString(),
  };
}

export const mockOperationsApi = {
  issueCard: async (body: IssueCardRequest): Promise<BankCard> => {
    const { user } = await requireAccess();
    if (state.cards.length + state.linked.length >= MAX_CARDS) fail(409, 'card_limit_reached');
    const last4 = String(1000 + Math.floor(Math.random() * 9000));
    const card: BankCard = {
      id: nextId('card'),
      accountId: 'acc_byn',
      productName: 'Flex',
      brand: body.brand,
      kind: 'debit',
      last4,
      balance: money(0, 'BYN'),
      style: body.style,
      status: 'active',
      contactless: true,
    };
    state.cards.push(card);
    state.details.push({
      cardId: card.id,
      pan: `${body.brand === 'visa' ? '453271' : '537541'}000000${last4}`,
      expiry: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${(new Date().getFullYear() + 4) % 100}`,
      cvv: String(100 + Math.floor(Math.random() * 900)),
      holderName: `${user.firstName} ${user.lastName}`.toUpperCase(),
    });
    return respond(card);
  },

  setCardFrozen: async (cardId: string, frozen: boolean): Promise<BankCard> => {
    await requireAccess();
    const card = state.cards.find((item) => item.id === cardId);
    if (!card) fail(404, 'card_not_found');
    card.status = frozen ? 'frozen' : 'active';
    return respond({ ...card });
  },

  openAccount: async (currency: string): Promise<OpenedAccount> => {
    const { user } = await requireAccess();
    const code = currency.trim().toUpperCase();
    const asset = mockMarkets.find((item) => item.symbol === code && item.kind !== 'stock');
    if (!asset && code !== 'BYN') fail(422, 'CURRENCY_NOT_SUPPORTED');
    const kind = asset?.kind === 'crypto' ? 'crypto' : 'fiat';
    if (kind === 'crypto' && user.role !== 'pro') fail(403, 'KYC_REQUIRED');
    const existing = state.balance.accounts.find((item) => item.currency === code);
    if (existing) {
      return respond({ id: existing.id, currency: code, kind: existing.kind, name: existing.name });
    }
    const opened: AccountBalance = {
      id: nextId('acc'),
      currency: code,
      kind,
      name: asset?.name ?? code,
      amount: money(0, code),
      amountDigits: kind === 'crypto' ? 8 : 2,
      valueBase: money(0, 'BYN'),
      changePercent: 0,
      color: asset?.badgeColor ?? palette.accent,
      series: [],
    };
    state.balance.accounts.push(opened);
    return respond({ id: opened.id, currency: code, kind, name: opened.name });
  },

  getLinkedCards: async (): Promise<LinkedCard[]> => {
    await requireAccess();
    return respond([...state.linked]);
  },

  linkCard: async (body: LinkCardRequest): Promise<LinkedCard> => {
    await requireAccess();
    const pan = body.pan.replace(/\D/g, '');
    if (pan.length < 13 || pan.length > 19 || !luhn(pan)) fail(422, 'PAN_INVALID');
    if (!TEST_PANS.has(pan))
      fail(422, 'TEST_CARDS_ONLY', { details: { testCards: [...TEST_PANS] } });
    const [month = 0, year = 0] = body.expiry.split('/').map(Number);
    const now = new Date();
    // срок — до конца месяца: сравниваются «год × 12 + месяц»
    if (
      month < 1 ||
      month > 12 ||
      (2000 + year) * 12 + month < now.getFullYear() * 12 + now.getMonth() + 1
    ) {
      fail(422, 'CARD_EXPIRED');
    }
    if (state.linked.some((item) => item.last4 === pan.slice(-4))) fail(409, 'CARD_ALREADY_LINKED');
    if (state.cards.length + state.linked.length >= MAX_CARDS) fail(409, 'card_limit_reached');
    const linked: LinkedCard = {
      id: nextId('linked'),
      brand: pan.startsWith('4') ? 'visa' : 'mastercard',
      last4: pan.slice(-4),
      expiry: body.expiry,
      holderName: body.holderName.toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    state.linked.push(linked);
    return respond(linked);
  },

  topUp: async (body: TopUpRequest, key: string): Promise<OperationResult> => {
    await requireAccess();
    const result = once(key, () => {
      const linked = state.linked.find((item) => item.id === body.linkedCardId);
      if (!linked) fail(404, 'linked_card_not_found');
      const target = account(body.toAccountId);
      if (target.kind !== 'fiat') fail(422, 'CURRENCY_NOT_SUPPORTED');
      if (body.amountMinor > TOPUP_MAX_MINOR) {
        fail(422, 'LIMIT_EXCEEDED', { details: { maxAmountMinor: TOPUP_MAX_MINOR } });
      }
      const decline = DECLINES[linked.last4];
      if (decline) fail(402, decline);
      credit(target, body.amountMinor);
      record(
        target,
        `Пополнение с карты •• ${linked.last4}`,
        'transfer',
        body.amountMinor,
        'incoming',
      );
      revalue();
      return {
        transactionId: nextId('tx'),
        status: 'completed' as const,
        amount: money(body.amountMinor, target.currency),
        fee: money(0, target.currency),
        createdAt: new Date().toISOString(),
      };
    });
    return respond(result);
  },

  withdraw: async (body: WithdrawalRequest, key: string): Promise<OperationResult> => {
    await requireAccess();
    const result = once(key, () => {
      const linked = state.linked.find((item) => item.id === body.linkedCardId);
      if (!linked) fail(404, 'linked_card_not_found');
      const source = account(body.fromAccountId);
      if (source.kind !== 'fiat') fail(422, 'CURRENCY_NOT_SUPPORTED');
      debit(source, body.amountMinor);
      record(source, `Вывод на карту •• ${linked.last4}`, 'transfer', body.amountMinor, 'outgoing');
      revalue();
      return {
        transactionId: nextId('tx'),
        status: 'completed' as const,
        amount: money(body.amountMinor, source.currency),
        fee: money(0, source.currency),
        createdAt: new Date().toISOString(),
      };
    });
    return respond(result);
  },

  pay: async (body: PaymentRequest, key: string): Promise<PaymentResult> => {
    await requireAccess();
    const result = once(key, () => {
      const card = state.cards.find((item) => item.id === body.cardId);
      if (!card) fail(404, 'card_not_found');
      if (card.status === 'frozen') fail(409, 'card_frozen');
      const source = account(card.accountId);
      debit(source, body.amountMinor);
      record(source, body.merchant, body.category ?? 'shopping', body.amountMinor, 'outgoing');
      revalue();
      return {
        transactionId: nextId('tx'),
        status: 'completed' as const,
        amount: money(body.amountMinor, source.currency),
        fee: money(0, source.currency),
        createdAt: new Date().toISOString(),
        fundedWith: null,
        rate: null,
        cashback: money(0, source.currency),
      };
    });
    return respond(result);
  },

  transfer: async (body: TransferRequest, key: string): Promise<TransferResult> => {
    const { db, user } = await requireAccess();
    const result = once(key, () => {
      const phone = body.recipientPhone.replace(/[^\d+]/g, '');
      const recipient = Object.values(db.users).find((item) => item.phone === phone);
      if (!recipient) fail(404, 'RECIPIENT_NOT_FOUND');
      if (recipient.id === user.id) fail(422, 'SELF_TRANSFER');
      const source = account(body.fromAccountId);
      if (source.kind !== 'fiat') fail(422, 'CURRENCY_NOT_SUPPORTED');
      debit(source, body.amountMinor);
      const name = `${recipient.firstName} ${recipient.lastName.slice(0, 1)}.`.trim();
      record(source, `Перевод: ${name}`, 'transfer', body.amountMinor, 'outgoing');
      revalue();
      return {
        transactionId: nextId('tx'),
        status: 'completed' as const,
        fromAccountId: source.id,
        recipientName: name,
        amount: money(body.amountMinor, source.currency),
        fee: money(0, source.currency),
        createdAt: new Date().toISOString(),
      };
    });
    return respond(result);
  },

  exchange: async (body: ExchangeRequest, key: string): Promise<ExchangeResult> => {
    await requireAccess();
    const result = once(key, () => {
      if (
        account(body.fromAccountId).kind === 'crypto' ||
        account(body.toAccountId).kind === 'crypto'
      ) {
        fail(403, 'CRYPTO_SCOPE_REQUIRED');
      }
      return swap(body, (from, to) => `Обмен ${from} → ${to}`);
    });
    return respond(result);
  },

  convert: async (body: ExchangeRequest, key: string): Promise<ExchangeResult> => {
    await requireCrypto();
    return respond(once(key, () => swap(body, (from, to) => `Обмен ${from} → ${to}`)));
  },

  subscribeEarn: async (body: EarnSubscribeRequest): Promise<EarnPosition> => {
    await requireCrypto();
    const product = mockEarnProducts.find((item) => item.id === body.productId);
    if (!product) fail(404, 'earn_product_not_found');
    const wallet = state.balance.accounts.find((item) => item.currency === product.symbol);
    if (!wallet) fail(422, 'WALLET_NOT_FOUND');
    if (body.amountMinor < product.minAmount * 10 ** wallet.amountDigits)
      fail(422, 'AMOUNT_TOO_SMALL');
    debit(wallet, body.amountMinor);
    revalue();
    const now = new Date();
    return respond({
      id: nextId('earn'),
      productId: product.id,
      assetId: product.assetId,
      symbol: product.symbol,
      badgeColor: product.badgeColor,
      principal: money(body.amountMinor, product.symbol),
      apyPercent: product.apyPercent,
      termDays: product.termDays,
      startedAt: now.toISOString(),
      maturesAt: product.termDays
        ? new Date(now.getTime() + product.termDays * 86_400_000).toISOString()
        : null,
      status: 'active',
      accruedInterest: money(0, product.symbol),
      redeemedAt: null,
      interestPaid: null,
    });
  },
};
