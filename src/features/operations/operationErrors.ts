import type { TFunction } from 'i18next';

import { ApiError } from '@/api';

/** код ошибки сервера → текст для пользователя (`operations.errors.<CODE>`) */
export function operationErrorMessage(error: unknown, t: TFunction): string {
  if (!(error instanceof ApiError)) return t('operations.errors.generic');
  const key = `operations.errors.${error.code}`;
  const text = t(key);
  return text === key ? t('operations.errors.generic') : text;
}
