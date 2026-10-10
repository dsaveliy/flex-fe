import { palette } from '@/theme/palette';
import { money } from '@/utils/money';

import type {
  BalanceSummary,
  BankCard,
  BankCardDetails,
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

export const mockCardDetails: BankCardDetails[] = [
  { cardId: 'card_1', pan: '4532718209344821', expiry: '08/29', cvv: '417', holderName: 'ROMAN PONYAVIN' },
  { cardId: 'card_2', pan: '5375410366207734', expiry: '03/28', cvv: '902', holderName: 'ROMAN PONYAVIN' },
  { cardId: 'card_3', pan: '4916052877311092', expiry: '11/30', cvv: '158', holderName: 'ROMAN PONYAVIN' },
  { cardId: 'card_4', pan: '5168442190855510', expiry: '01/27', cvv: '664', holderName: 'ROMAN PONYAVIN' },
];

type TxTemplate = [
  merchant: string,
  category: Transaction['category'],
  direction: Transaction['direction'],
  amountMinor: number,
  /** сколько дней назад, дробная часть — время суток */
  daysAgo: number,
];

/**
 * операции по картам за последний год. даты считаются от текущего момента,
 * чтобы список всегда выглядел свежим и фильтр по периодам было на чём проверить.
 */
const TX_BY_CARD: Record<string, TxTemplate[]> = {
  card_1: [
    ['MAK.by', 'shopping', 'outgoing', 12_490, 0.3],
    ['Café 101', 'cafe', 'outgoing', 4_250, 0.9],
    ['Yandex Go', 'transport', 'outgoing', 1_830, 1.4],
    ['Salary', 'salary', 'incoming', 285_000, 3.6],
    ['Spotify', 'subscription', 'outgoing', 2_199, 5.3],
    ['Евроопт', 'shopping', 'outgoing', 6_874, 8.7],
    ['Transfer from Ivan', 'transfer', 'incoming', 15_000, 13.5],
    ['Coffee Lab', 'cafe', 'outgoing', 890, 19.4],
    ['Belarusbank ATM', 'other', 'outgoing', 20_000, 27.6],
    ['Salary', 'salary', 'incoming', 285_000, 34.6],
    ['Zara', 'shopping', 'outgoing', 18_990, 52.7],
    ['Netflix', 'subscription', 'outgoing', 1_699, 66.3],
    ['Belavia', 'transport', 'outgoing', 74_500, 128.5],
    ['IKEA', 'shopping', 'outgoing', 41_230, 210.6],
  ],
  card_2: [
    ['Wolt', 'cafe', 'outgoing', 3_640, 0.6],
    ['Binance P2P', 'transfer', 'incoming', 48_000, 2.4],
    ['Apple', 'subscription', 'outgoing', 999, 4.3],
    ['Green', 'shopping', 'outgoing', 9_315, 6.8],
    ['Яндекс Такси', 'transport', 'outgoing', 1_270, 11.9],
    ['Transfer to Maria', 'transfer', 'outgoing', 50_000, 17.5],
    ['Starbucks', 'cafe', 'outgoing', 1_150, 31.4],
    ['Ozon', 'shopping', 'outgoing', 7_420, 75.6],
    ['Cashback', 'other', 'incoming', 2_310, 97.5],
    ['Steam', 'shopping', 'outgoing', 5_999, 160.8],
  ],
  card_3: [
    ['Lamoda', 'shopping', 'outgoing', 12_900, 1.7],
    ['A1', 'subscription', 'outgoing', 2_500, 3.4],
    ['Pizza Tempo', 'cafe', 'outgoing', 4_870, 9.8],
    ['Transfer from Anna', 'transfer', 'incoming', 30_000, 22.5],
    ['Белнефтехим', 'transport', 'outgoing', 9_000, 45.4],
    ['Wildberries', 'shopping', 'outgoing', 3_215, 88.7],
    ['Interest', 'other', 'incoming', 1_120, 181.5],
  ],
  card_4: [
    ['Booking.com', 'shopping', 'outgoing', 61_400, 12.6],
    ['Airbnb', 'shopping', 'outgoing', 38_750, 40.5],
    ['Credit repayment', 'transfer', 'incoming', 100_000, 70.4],
    ['Uber', 'transport', 'outgoing', 2_340, 139.9],
  ],
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const mockTransactions: Transaction[] = Object.entries(TX_BY_CARD)
  .flatMap(([cardId, templates]) =>
    templates.map(([merchant, category, direction, amountMinor, daysAgo], index) => ({
      id: `tx_${cardId}_${index + 1}`,
      cardId,
      merchant,
      category,
      direction,
      amount: money(amountMinor, 'BYN'),
      occurredAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
    })),
  )
  .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

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
