import type { LogContext } from './types';

/**
 * ключи, значения которых нельзя отправлять даже в свои логи: пароль, токены, PIN, данные карты,
 * одноразовые коды. `code` с кодом ошибки сервера (`RECIPIENT_NOT_FOUND`) — не секрет и остаётся.
 * сервер вычищает их второй раз (flex-be: app/services/client_logs.py)
 */
const SECRET_KEY =
  /pass(word|code)?|token|secret|authorization|cookie|cvv|cvc|otp|(^|[a-z_])(pin|pan)$|(sms|verification|confirm)_?code/i;
const MAX_STRING = 500;
const MAX_DEPTH = 4;
const MAX_ITEMS = 20;

export const REDACTED = '[redacted]';

function clean(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return String(value);

  if (seen.has(value)) return '[circular]';
  if (depth >= MAX_DEPTH) return '[depth]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ITEMS).map((item) => clean(item, depth + 1, seen));
  }
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_KEY.test(key) ? REDACTED : clean(item, depth + 1, seen);
  }
  return out;
}

/** копия контекста без секретов, циклов и слишком длинных значений; пустой → `undefined` */
export function redact(context: LogContext | undefined): LogContext | undefined {
  if (!context) return undefined;
  const result = clean(context, 0, new WeakSet()) as LogContext;
  return Object.keys(result).length > 0 ? result : undefined;
}

/** адрес запроса без query: в query бывают коды и токены */
export function safePath(url: string): string {
  return url.split('?')[0] ?? url;
}
