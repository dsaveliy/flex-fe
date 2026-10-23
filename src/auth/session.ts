import type { TokenPair } from '@/api/types';

import { decodeJws } from './jws';
import { createStore } from './store';
import type { AccessClaims, AuthStatus, SignOutReason } from './types';

export type SessionState = {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  /** payload access-токена — только для UI (роль, время жизни), не для проверок */
  claims: AccessClaims | null;
  /** причина последнего выхода; показывается на экране входа */
  signOutReason: SignOutReason | null;
};

/**
 * сессия Уровня 1. держится в памяти (access никогда не пишется на диск),
 * refresh дублируется в Keychain из `sessionActions.ts`
 */
export const sessionStore = createStore<SessionState>({
  status: 'loading',
  accessToken: null,
  refreshToken: null,
  claims: null,
  signOutReason: null,
});

export function setSessionTokens(pair: TokenPair): void {
  const decoded = decodeJws<AccessClaims>(pair.accessToken);
  sessionStore.set({
    status: 'signedIn',
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    claims: decoded?.payload ?? null,
    signOutReason: null,
  });
}

export function clearSession(reason: SignOutReason | null): void {
  sessionStore.set({
    status: 'signedOut',
    accessToken: null,
    refreshToken: null,
    claims: null,
    signOutReason: reason,
  });
}

export const getAccessToken = () => sessionStore.get().accessToken;
export const getRefreshToken = () => sessionStore.get().refreshToken;
