/**
 * разбор JWS compact (`header.payload.signature`).
 *
 * клиент только читает payload — чтобы знать `exp`, `role`, `sid`, — и никогда
 * не принимает по нему решений безопасности: подпись проверяет сервер.
 * payload токенов Flex содержит только ASCII (id, роли, время), поэтому здесь
 * нет полноценного UTF-8.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function base64UrlEncode(ascii: string): string {
  let out = '';
  for (let i = 0; i < ascii.length; i += 3) {
    const a = ascii.charCodeAt(i);
    const b = i + 1 < ascii.length ? ascii.charCodeAt(i + 1) : NaN;
    const c = i + 2 < ascii.length ? ascii.charCodeAt(i + 2) : NaN;
    const triple = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += ALPHABET[(triple >> 18) & 63] + ALPHABET[(triple >> 12) & 63];
    if (!Number.isNaN(b)) out += ALPHABET[(triple >> 6) & 63];
    if (!Number.isNaN(c)) out += ALPHABET[triple & 63];
  }
  return out;
}

export function base64UrlDecode(input: string): string {
  // стандартный base64 тоже принимаем
  const clean = input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) throw new Error('invalid base64url');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return out;
}

export type DecodedJws<T> = {
  header: { alg: string; typ?: string; kid?: string };
  payload: T;
  signingInput: string;
  signature: string;
};

/** `null`, если строка не похожа на JWS */
export function decodeJws<T>(token: string): DecodedJws<T> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return {
      header: JSON.parse(base64UrlDecode(parts[0])),
      payload: JSON.parse(base64UrlDecode(parts[1])) as T,
      signingInput: `${parts[0]}.${parts[1]}`,
      signature: parts[2],
    };
  } catch {
    return null;
  }
}

/** сколько миллисекунд осталось до `exp` (может быть отрицательным) */
export function expiresInMs(claims: { exp: number }, now = Date.now()): number {
  return claims.exp * 1000 - now;
}

export function isExpired(claims: { exp: number }, skewMs = 0, now = Date.now()): boolean {
  return expiresInMs(claims, now) <= skewMs;
}
