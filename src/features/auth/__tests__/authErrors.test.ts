import type { TFunction } from 'i18next';

import { ApiError } from '@/api/client';

import { authErrorMessage, formatWait } from '../authErrors';

jest.mock('@/api', () => jest.requireActual('@/api/client'));

// t возвращает ключ и параметры: так видно, какой текст выбрал код
const t = ((key: string, params?: Record<string, unknown>) =>
  key === 'auth.errors.UNKNOWN_CODE' ? key : params ? `${key} ${JSON.stringify(params)}` : key) as unknown as TFunction;

describe('authErrors', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [125, '2:05'],
    [59.2, '1:00'],
    [-3, '0:00'],
  ])('formatWait(%p) = %p', (seconds, expected) => {
    expect(formatWait(seconds)).toBe(expected);
  });

  it('блокировка показывает время ожидания из Retry-After', () => {
    const error = new ApiError({ status: 429, code: 'TOO_MANY_ATTEMPTS', message: '', retryAfter: 125 });
    expect(authErrorMessage(error, t)).toBe('auth.errors.TOO_MANY_ATTEMPTS {"time":"2:05"}');
  });

  it('неверный фактор показывает остаток попыток', () => {
    const error = new ApiError({ status: 401, code: 'FACTOR_INVALID', message: '', attemptsLeft: 2 });
    expect(authErrorMessage(error, t)).toBe('auth.errors.FACTOR_INVALID {"count":2}');
  });

  it('неизвестный код и не-ApiError → общий текст', () => {
    expect(authErrorMessage(new ApiError({ status: 400, code: 'UNKNOWN_CODE', message: '' }), t)).toBe(
      'auth.errors.generic',
    );
    expect(authErrorMessage(new TypeError('Network request failed'), t)).toBe('auth.errors.generic');
  });
});
