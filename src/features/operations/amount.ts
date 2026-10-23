import type { AccountBalance } from '@/api';
import { formatMoney } from '@/utils/money';

/** «12,5» → минорные единицы с учётом знаков валюты; `null` — не число или ≤ 0 */
export function parseAmount(text: string, digits: number): number | null {
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const [whole = '0', fraction = ''] = normalized.split('.');
  const minor =
    Number(whole) * 10 ** digits + Number(fraction.slice(0, digits).padEnd(digits, '0'));
  return minor > 0 && Number.isSafeInteger(minor) ? minor : null;
}

/** ввод суммы: только цифры и один разделитель, не больше знаков валюты */
export function sanitizeAmount(text: string, digits: number): string {
  const cleaned = text.replace(/[^\d.,]/g, '').replace('.', ',');
  const [whole = '', ...rest] = cleaned.split(',');
  if (rest.length === 0) return whole;
  return digits === 0 ? whole : `${whole},${rest.join('').slice(0, digits)}`;
}

/** «1 000,00 BYN» для счёта с его числом знаков */
export function formatBalance(account: AccountBalance): string {
  return formatMoney(account.amount, { minorUnitDigits: account.amountDigits });
}
