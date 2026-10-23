import { AppState } from 'react-native';

import type { CryptoSession } from '@/api/types';

import { decodeJws } from './jws';
import { createStore } from './store';
import type { CryptoClaims, CryptoLockReason } from './types';

/** сколько приложение может провести в фоне, прежде чем Crypto закроется */
export const BACKGROUND_LOCK_MS = 60_000;

export type CryptoSessionState = {
  token: string | null;
  claims: CryptoClaims | null;
  /** когда сессия закроется без активности (мс) */
  idleDeadline: number | null;
  /** абсолютный предел из `exp` (мс) */
  absoluteDeadline: number | null;
  idleTimeoutMs: number;
  lockReason: CryptoLockReason | null;
};

const LOCKED: CryptoSessionState = {
  token: null,
  claims: null,
  idleDeadline: null,
  absoluteDeadline: null,
  idleTimeoutMs: 0,
  lockReason: null,
};

/**
 * сессия криптораздела (Уровень 2). crypto-токен живёт только в памяти и не
 * обновляется: по таймауту неактивности, абсолютному пределу, долгому фону
 * или ответу `CRYPTO_AUTH_REQUIRED` раздел закрывается и снова просит фактор
 */
export const cryptoStore = createStore<CryptoSessionState>(LOCKED);

let timer: ReturnType<typeof setTimeout> | null = null;

function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  const { idleDeadline, absoluteDeadline } = cryptoStore.get();
  if (idleDeadline === null || absoluteDeadline === null) return;
  const deadline = Math.min(idleDeadline, absoluteDeadline);
  timer = setTimeout(checkDeadlines, Math.max(0, deadline - Date.now()));
}

function checkDeadlines(): void {
  const { idleDeadline, absoluteDeadline } = cryptoStore.get();
  if (idleDeadline === null || absoluteDeadline === null) return;
  const now = Date.now();
  if (now >= absoluteDeadline) lockCryptoLocal('expired');
  else if (now >= idleDeadline) lockCryptoLocal('idle');
  else schedule();
}

export function setCryptoSession(session: CryptoSession): void {
  const claims = decodeJws<CryptoClaims>(session.cryptoToken)?.payload ?? null;
  const idleTimeoutMs = session.idleTimeoutSec * 1000;
  cryptoStore.set({
    token: session.cryptoToken,
    claims,
    idleTimeoutMs,
    idleDeadline: Date.now() + idleTimeoutMs,
    absoluteDeadline: new Date(session.expiresAt).getTime(),
    lockReason: null,
  });
  schedule();
}

/** успешный запрос к crypto-api: сервер продлил окно неактивности, повторяем у себя */
export function touchCryptoSession(): void {
  const state = cryptoStore.get();
  if (!state.token) return;
  cryptoStore.set({ ...state, idleDeadline: Date.now() + state.idleTimeoutMs });
  schedule();
}

/** закрыть раздел только на клиенте; серверный logout — в `sessionActions.lockCrypto` */
export function lockCryptoLocal(reason: CryptoLockReason): void {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!cryptoStore.get().token && cryptoStore.get().lockReason === reason) return;
  cryptoStore.set({ ...LOCKED, lockReason: reason });
}

/** выход из приложения: сессия закрыта, а причина не нужна — следующий вход начнётся с чистого экрана */
export function resetCryptoSession(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  cryptoStore.set(LOCKED);
}

export const getCryptoToken = () => cryptoStore.get().token;

// фон: таймеры JS на iOS там не идут, поэтому сверяемся при возвращении
let backgroundSince: number | null = null;
AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    backgroundSince = Date.now();
    return;
  }
  if (state !== 'active') return;
  const away = backgroundSince === null ? 0 : Date.now() - backgroundSince;
  backgroundSince = null;
  if (!cryptoStore.get().token) return;
  if (away > BACKGROUND_LOCK_MS) lockCryptoLocal('background');
  else checkDeadlines();
});
