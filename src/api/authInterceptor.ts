import { lockCryptoLocal, touchCryptoSession } from '@/auth/cryptoSession';
import { sessionStore } from '@/auth/session';
import { ensureFreshAccess, refreshSession, signOutLocal } from '@/auth/sessionActions';

import { ApiError, type AuthScope, isApiError } from './client';
import { API_AUTH_SCOPE, type FlexApi } from './services';

/**
 * единая реакция на ошибки авторизации, одинаковая для mock и HTTP:
 * - access почти истёк → заранее refresh;
 * - `TOKEN_EXPIRED` → refresh и один повтор;
 * - `TOKEN_REVOKED` / `TOKEN_INVALID` → выход на экран входа;
 * - `CRYPTO_AUTH_REQUIRED` → криптораздел закрывается и просит фактор;
 * - успешный запрос к crypto-api продлевает окно неактивности
 */
async function run<T>(scope: AuthScope, call: () => Promise<T>, retried = false): Promise<T> {
  if (scope === 'none' || scope === 'refresh') return call();

  // после выхода запоздавшие запросы экранов не должны менять причину выхода
  if (sessionStore.get().status !== 'signedIn') {
    throw new ApiError({ status: 401, code: 'TOKEN_INVALID', message: 'Not signed in' });
  }

  await ensureFreshAccess();

  try {
    const result = await call();
    if (scope === 'crypto') touchCryptoSession();
    return result;
  } catch (error) {
    if (!retried && isApiError(error, 'TOKEN_EXPIRED')) {
      await refreshSession();
      return run(scope, call, true);
    }
    if (isApiError(error, 'TOKEN_REVOKED') || isApiError(error, 'TOKEN_INVALID')) {
      await signOutLocal('revoked');
    } else if (isApiError(error, 'CRYPTO_AUTH_REQUIRED')) {
      lockCryptoLocal('server');
    }
    throw error;
  }
}

export function withAuth(base: FlexApi): FlexApi {
  const wrapped: Record<string, unknown> = {};
  for (const method of Object.keys(API_AUTH_SCOPE) as (keyof FlexApi)[]) {
    const fn = base[method] as (...args: unknown[]) => Promise<unknown>;
    wrapped[method] = (...args: unknown[]) => run(API_AUTH_SCOPE[method], () => fn(...args));
  }
  return wrapped as FlexApi;
}
