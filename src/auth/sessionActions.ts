import { ApiError, isApiError } from '@/api/client';
import { baseApi } from '@/api/services';
import type { TokenPair } from '@/api/types';
import { logger } from '@/logging';

import { lockCryptoLocal, resetCryptoSession } from './cryptoSession';
import { getDeviceId } from './deviceId';
import { isExpired } from './jws';
import { SECURE_KEYS, secureStorage } from './secureStorage';
import { clearSession, getRefreshToken, sessionStore, setSessionTokens } from './session';
import type { SignOutReason } from './types';

/** access обновляется заранее, если до истечения осталось меньше этого */
const ACCESS_REFRESH_SKEW_MS = 30_000;

const log = logger.child('auth');

/**
 * ядро сессии Уровня 1. работает с «сырым» `baseApi`, а не с обёрткой
 * `api`: обёртка сама вызывает отсюда `refreshSession`, и иначе получился бы цикл
 */

async function applyTokenPair(pair: TokenPair): Promise<void> {
  setSessionTokens(pair);
  await secureStorage.set(SECURE_KEYS.refreshToken, pair.refreshToken);
}

export async function signInWithPassword(identifier: string, password: string): Promise<void> {
  const deviceId = await getDeviceId();
  // логин целиком не пишем: только тип (почта или телефон)
  const by = identifier.includes('@') ? 'email' : 'phone';
  try {
    const pair = await baseApi.login({ identifier, password, deviceId });
    await applyTokenPair(pair);
    log.info('signed in', { by });
  } catch (error) {
    log.warn('sign in failed', { by, code: isApiError(error) ? error.code : 'network' });
    throw error;
  }
}

/** локальный выход: память, Keychain и криптосессия. сервер не трогает */
export async function signOutLocal(reason: SignOutReason): Promise<void> {
  log.info('signed out', { reason });
  resetCryptoSession();
  clearSession(reason);
  await secureStorage.remove(SECURE_KEYS.refreshToken);
}

/** «Выйти»: отзыв токенов устройства на сервере, затем локальная очистка */
export async function signOut(): Promise<void> {
  try {
    await ensureFreshAccess();
    await baseApi.logout();
  } catch {
    // сессия уже недействительна или нет сети — выходим локально в любом случае
  }
  await signOutLocal('user');
}

let inflight: Promise<void> | null = null;

/**
 * ротация refresh. single-flight: параллельные запросы с истёкшим access
 * ждут один общий refresh, иначе второй предъявил бы уже отозванный refresh
 * и сервер принял бы это за кражу
 */
export function refreshSession(): Promise<void> {
  if (inflight) return inflight;

  inflight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      await signOutLocal('expired');
      throw new ApiError({ status: 401, code: 'TOKEN_INVALID', message: 'No refresh token' });
    }
    try {
      const pair = await baseApi.refresh({ refreshToken, deviceId: await getDeviceId() });
      await applyTokenPair(pair);
      log.debug('tokens refreshed');
    } catch (error) {
      log.warn('refresh failed', { code: isApiError(error) ? error.code : 'network' });
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        await signOutLocal(error.code === 'TOKEN_REVOKED' ? 'revoked' : 'expired');
      }
      throw error;
    }
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

/** обновляет access заранее, если он вот-вот истечёт */
export async function ensureFreshAccess(): Promise<void> {
  const { accessToken, claims } = sessionStore.get();
  if (!accessToken || !claims) return;
  if (isExpired(claims, ACCESS_REFRESH_SKEW_MS)) await refreshSession();
}

/** холодный старт: refresh из Keychain → новая пара, иначе экран входа */
export async function bootstrapSession(): Promise<void> {
  const stored = await secureStorage.get(SECURE_KEYS.refreshToken);
  if (!stored) {
    clearSession(null);
    return;
  }
  sessionStore.set((state) => ({ ...state, refreshToken: stored }));
  try {
    await refreshSession();
  } catch (error) {
    // 401/403 уже обработаны в refreshSession; без сети refresh остаётся в Keychain
    if (sessionStore.get().status === 'loading') clearSession(null);
    if (!isApiError(error)) log.warn('bootstrap failed, staying offline', { error: String(error) });
  }
}

/** закрыть криптораздел: отзыв crypto-токена на сервере и очистка памяти */
export async function lockCrypto(): Promise<void> {
  try {
    await baseApi.cryptoLogout();
  } catch {
    // токен уже недействителен — достаточно забыть его
  }
  lockCryptoLocal('manual');
}
