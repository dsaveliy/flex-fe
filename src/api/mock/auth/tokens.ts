import { CryptoDigestAlgorithm, CryptoEncoding, digestStringAsync, randomUUID } from 'expo-crypto';

import { base64UrlEncode, decodeJws } from '@/auth/jws';
import type { AccessClaims, CryptoClaims } from '@/auth/types';

import { ApiError } from '../../client';
import type { CryptoSession, TokenPair } from '../../types';
import { MOCK_AUTH, type SigningKey } from './config';
import { type IssuedToken, type MockAuthDb, type MockUser, nowSec, type TokenType } from './db';

/**
 * выпуск и проверка JWS для заглушки сервера. подпись — SHA-256 от секрета
 * и `header.payload` (имитация HS256): её достаточно, чтобы подмена payload
 * на клиенте не проходила. в проде — RS256/EdDSA и PyJWT на бэкенде
 */
async function sign(signingInput: string, key: SigningKey): Promise<string> {
  const base64 = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    `${key.secret}.${signingInput}`,
    { encoding: CryptoEncoding.BASE64 },
  );
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function issueJws(payload: object, key: SigningKey): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT', kid: key.kid };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  return `${signingInput}.${await sign(signingInput, key)}`;
}

/** payload, если подпись и kid верны, иначе `null` */
export async function verifyJws<T>(token: string, key: SigningKey): Promise<T | null> {
  const decoded = decodeJws<T>(token);
  if (!decoded || decoded.header.kid !== key.kid) return null;
  return (await sign(decoded.signingInput, key)) === decoded.signature ? decoded.payload : null;
}

export function fail(
  status: number,
  code: string,
  extra: { attemptsLeft?: number; retryAfter?: number; details?: Record<string, unknown> } = {},
): never {
  throw new ApiError({ status, code, message: code, ...extra });
}

function record(db: MockAuthDb, token: Omit<IssuedToken, 'revoked'>): void {
  db.tokens[token.jti] = { ...token, revoked: false };
}

/** пара Уровня 1 в рамках семейства `sid` */
export async function issuePair(
  db: MockAuthDb,
  user: MockUser,
  sid: string,
  deviceId: string,
): Promise<TokenPair> {
  const iat = nowSec();
  const make = (type: 'access' | 'refresh', ttl: number): AccessClaims => ({
    iss: MOCK_AUTH.issuer,
    sub: user.id,
    type,
    role: user.role,
    device_id: deviceId,
    sid,
    jti: randomUUID(),
    iat,
    nbf: iat,
    exp: iat + ttl,
  });
  const access = make('access', MOCK_AUTH.accessTtlSec);
  const refresh = make('refresh', MOCK_AUTH.refreshTtlSec);
  for (const claims of [access, refresh]) {
    record(db, {
      jti: claims.jti,
      sub: user.id,
      deviceId,
      sid,
      type: claims.type,
      exp: claims.exp,
    });
  }
  return {
    accessToken: await issueJws(access, MOCK_AUTH.keys.level1),
    refreshToken: await issueJws(refresh, MOCK_AUTH.keys.level1),
  };
}

/** crypto-токен: своя аудитория и ключ, без refresh */
export async function issueCryptoToken(
  db: MockAuthDb,
  parent: AccessClaims,
  amr: string[],
): Promise<CryptoSession> {
  const iat = nowSec();
  const claims: CryptoClaims = {
    iss: MOCK_AUTH.issuer,
    sub: parent.sub,
    aud: 'crypto-api',
    type: 'crypto_access',
    scope: 'crypto',
    parent_jti: parent.jti,
    sid: parent.sid,
    device_id: parent.device_id,
    amr,
    jti: randomUUID(),
    iat,
    exp: iat + MOCK_AUTH.cryptoMaxSec,
  };
  record(db, {
    jti: claims.jti,
    sub: claims.sub,
    deviceId: claims.device_id,
    sid: claims.sid,
    type: 'crypto_access',
    exp: claims.exp,
    lastSeen: Date.now(),
  });
  return {
    cryptoToken: await issueJws(claims, MOCK_AUTH.keys.crypto),
    idleTimeoutSec: MOCK_AUTH.cryptoIdleSec,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
}

export function revokeTokens(db: MockAuthDb, sid: string, types: TokenType[]): void {
  for (const token of Object.values(db.tokens)) {
    if (token.sid === sid && types.includes(token.type)) token.revoked = true;
  }
}

/** отзыв всего семейства: выход, «выйти везде», обнаружение кражи */
export function revokeSession(db: MockAuthDb, sid: string): void {
  const session = db.sessions[sid];
  if (session) session.revoked = true;
  revokeTokens(db, sid, ['access', 'refresh', 'crypto_access']);
}
