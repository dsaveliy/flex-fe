import type { TFunction } from 'i18next';

import { ApiError } from '@/api';

/** `125` → `2:05` */
export function formatWait(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/** код ошибки сервера → текст для пользователя (`auth.errors.<CODE>`) */
export function authErrorMessage(error: unknown, t: TFunction): string {
  if (!(error instanceof ApiError)) return t('auth.errors.generic');
  switch (error.code) {
    case 'TOO_MANY_ATTEMPTS':
      return t('auth.errors.TOO_MANY_ATTEMPTS', { time: formatWait(error.retryAfter ?? 60) });
    case 'FACTOR_INVALID':
      return t('auth.errors.FACTOR_INVALID', { count: error.attemptsLeft ?? 0 });
    default: {
      const key = `auth.errors.${error.code}`;
      const text = t(key);
      return text === key ? t('auth.errors.generic') : text;
    }
  }
}
