import type { Role } from '@/api/types';

/** общие поля payload JWS по ТЗ (раздел 3.3) */
type BaseClaims = {
  iss: string;
  /** id пользователя */
  sub: string;
  device_id: string;
  /** семейство токенов одного входа на устройстве (session id) */
  sid: string;
  jti: string;
  iat: number;
  exp: number;
};

/** access и refresh Уровня 1 */
export type AccessClaims = BaseClaims & {
  type: 'access' | 'refresh';
  role: Role;
  nbf: number;
};

/** crypto-токен Уровня 2 (раздел 4.4) */
export type CryptoClaims = BaseClaims & {
  type: 'crypto_access';
  aud: 'crypto-api';
  scope: 'crypto';
  /** jti access-токена, при котором выдан crypto-токен */
  parent_jti: string;
  /** чем подтверждена личность: пароль и PIN или биометрия */
  amr: string[];
};

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

/** почему сессия закончилась: от этого зависит текст на экране входа */
export type SignOutReason = 'user' | 'revoked' | 'expired';

/** почему закрыт криптораздел */
export type CryptoLockReason = 'manual' | 'idle' | 'expired' | 'background' | 'server';
