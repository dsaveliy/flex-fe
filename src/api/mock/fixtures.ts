import { palette } from '@/theme/palette';
import { money } from '@/utils/money';

import type {
  BalanceSummary,
  BankCard,
  ExchangeRates,
  Mover,
  Portfolio,
  PromoOffer,
  Transaction,
  User,
} from '../types';
import { makeSeries } from './series';

export const mockUser: User = {
  id: 'usr_1',
  firstName: 'Роман',
  lastName: 'Понявин',
  avatarUrl: null,
};

const BALANCE_TOTAL = 12_480.5;

/** ряд, который заканчивается ровно на текущем балансе */
function balanceHistory(seed: number, points: number, volatility: number, drift: number) {
  const raw = makeSeries({ seed, points, start: 100, drift, volatility });
  const last = raw.at(-1) ?? 100;
  return raw.map((value) => Number(((value / last) * BALANCE_TOTAL).toFixed(2)));
}

export const mockBalance: BalanceSummary = {
  total: money(1_248_050, 'BYN'),
  monthChangePercent: 2.4,
  history: {
    '1D': balanceHistory(11, 48, 0.35, 0.01),
    '1W': balanceHistory(12, 42, 0.8, 0.04),
    '1M': balanceHistory(13, 60, 1.2, 0.06),
    '1Y': balanceHistory(14, 52, 2.6, 0.4),
    ALL: balanceHistory(15, 60, 3.4, 0.9),
  },
  // сумма valueBase по счетам = total (12 480.50 BYN)
  accounts: [
    {
      id: 'acc_byn',
      currency: 'BYN',
      kind: 'fiat',
      name: 'Белорусский рубль',
      amount: money(673_950, 'BYN'),
      amountDigits: 2,
      valueBase: money(673_950, 'BYN'),
      changePercent: 0.4,
      color: palette.accent,
      series: makeSeries({ seed: 21, start: 100, drift: 0.05, volatility: 0.4 }),
    },
    {
      id: 'acc_usd',
      currency: 'USD',
      kind: 'fiat',
      name: 'Доллар США',
      amount: money(30_000, 'USD'),
      amountDigits: 2,
      valueBase: money(98_100, 'BYN'),
      changePercent: -0.3,
      color: palette.blobBlue,
      series: makeSeries({ seed: 22, start: 100, drift: -0.02, volatility: 0.5 }),
    },
    {
      id: 'acc_btc',
      currency: 'BTC',
      kind: 'crypto',
      name: 'Bitcoin',
      amount: money(4_120_000, 'BTC'),
      amountDigits: 8,
      valueBase: money(352_010, 'BYN'),
      changePercent: 4.8,
      color: palette.mastercardOrange,
      series: makeSeries({ seed: 23, start: 100, drift: 0.3, volatility: 2.4 }),
    },
    {
      id: 'acc_eth',
      currency: 'ETH',
      kind: 'crypto',
      name: 'Ethereum',
      amount: money(9_800_000, 'ETH'),
      amountDigits: 8,
      valueBase: money(123_990, 'BYN'),
      changePercent: 2.1,
      color: palette.coinB,
      series: makeSeries({ seed: 24, start: 100, drift: 0.15, volatility: 2 }),
    },
  ],
};

export const mockRates: ExchangeRates = {
  base: 'BYN',
  // курс BTC согласован со счётом acc_btc: 0.0412 BTC = 3 520.10 BYN
  rates: { BYN: 1, USD: 3.27, EUR: 3.55, BTC: 85_440 },
  updatedAt: new Date().toISOString(),
};

export const mockPromo: PromoOffer = {
  id: 'promo_savings',
  titleKey: 'home.promo.title',
  subtitleKey: 'home.promo.subtitle',
};

export const mockCards: BankCard[] = [
  {
    id: 'card_1',
    productName: 'Flex',
    brand: 'visa',
    kind: 'debit',
    last4: '4821',
    balance: money(420_000, 'BYN'),
    style: 'mint',
    status: 'active',
    contactless: true,
  },
  {
    id: 'card_2',
    productName: 'Flex',
    brand: 'mastercard',
    kind: 'debit',
    last4: '7734',
    balance: money(235_075, 'BYN'),
    style: 'dark',
    status: 'active',
    contactless: true,
  },
  {
    id: 'card_3',
    productName: 'Flex',
    brand: 'visa',
    kind: 'debit',
    last4: '1092',
    balance: money(193_020, 'BYN'),
    style: 'grey',
    status: 'active',
    contactless: false,
  },
  {
    id: 'card_4',
    productName: 'Flex',
    brand: 'mastercard',
    kind: 'credit',
    last4: '5510',
    balance: money(85_000, 'BYN'),
    style: 'purple',
    status: 'frozen',
    contactless: true,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    cardId: 'card_1',
    merchant: 'MAK.by',
    category: 'shopping',
    direction: 'outgoing',
    amount: money(12_490, 'BYN'),
    occurredAt: '2026-02-12T18:24:00.000Z',
  },
  {
    id: 'tx_2',
    cardId: 'card_1',
    merchant: 'Salary',
    category: 'salary',
    direction: 'incoming',
    amount: money(285_000, 'BYN'),
    occurredAt: '2026-02-10T09:02:00.000Z',
  },
  {
    id: 'tx_3',
    cardId: 'card_1',
    merchant: 'Café 101',
    category: 'cafe',
    direction: 'outgoing',
    amount: money(4_250, 'BYN'),
    occurredAt: '2026-02-09T12:41:00.000Z',
  },
  {
    id: 'tx_4',
    cardId: 'card_2',
    merchant: 'Yandex Go',
    category: 'transport',
    direction: 'outgoing',
    amount: money(1_830, 'BYN'),
    occurredAt: '2026-02-08T21:15:00.000Z',
  },
  {
    id: 'tx_5',
    cardId: 'card_1',
    merchant: 'Spotify',
    category: 'subscription',
    direction: 'outgoing',
    amount: money(2_199, 'BYN'),
    occurredAt: '2026-02-07T07:30:00.000Z',
  },
  {
    id: 'tx_6',
    cardId: 'card_3',
    merchant: 'Transfer to Maria',
    category: 'transfer',
    direction: 'outgoing',
    amount: money(50_000, 'BYN'),
    occurredAt: '2026-02-06T16:05:00.000Z',
  },
];

export const mockGainers: Mover[] = [
  { id: 'api3', symbol: 'API3', changePercent: 79.79, badgeColor: palette.coinB },
  { id: 'rad', symbol: 'RAD', changePercent: 16.08, badgeColor: palette.coinF },
  { id: 'vinu', symbol: 'VINU', changePercent: 11.38, badgeColor: palette.coinC },
  { id: 'hopr', symbol: 'HOPR', changePercent: 11.37, badgeColor: palette.coinD },
  { id: 'uma', symbol: 'UMA', changePercent: 7.86, badgeColor: palette.coinE },
  { id: 'audio', symbol: 'AUDIO', changePercent: 7.64, badgeColor: palette.coinG },
  { id: 'vvv', symbol: 'VVV', changePercent: 6.56, badgeColor: palette.coinA },
  { id: 'ctc', symbol: 'CTC', changePercent: 6.2, badgeColor: palette.coinH },
];

export const mockLosers: Mover[] = [
  { id: 'lever', symbol: 'LEVER', changePercent: -23.41, badgeColor: palette.coinE },
  { id: 'mav', symbol: 'MAV', changePercent: -14.02, badgeColor: palette.coinB },
  { id: 'id', symbol: 'ID', changePercent: -11.85, badgeColor: palette.coinC },
  { id: 'tia', symbol: 'TIA', changePercent: -9.63, badgeColor: palette.coinF },
  { id: 'pyth', symbol: 'PYTH', changePercent: -8.14, badgeColor: palette.coinD },
  { id: 'jup', symbol: 'JUP', changePercent: -7.02, badgeColor: palette.coinG },
  { id: 'ordi', symbol: 'ORDI', changePercent: -6.48, badgeColor: palette.coinA },
  { id: 'wld', symbol: 'WLD', changePercent: -5.31, badgeColor: palette.coinH },
];

export const mockPortfolio: Portfolio = {
  value: money(482_030, 'USD'),
  dayChangePercent: 3.2,
  series: makeSeries({ seed: 7, start: 100, drift: 0.3, volatility: 1.6 }),
  holdings: [
    { assetId: 'btc', symbol: 'BTC', badgeColor: palette.coinA, weight: 0.54 },
    { assetId: 'eth', symbol: 'ETH', badgeColor: palette.coinB, weight: 0.31 },
    { assetId: 'audio', symbol: 'AUDIO', badgeColor: palette.coinG, weight: 0.15 },
  ],
};
