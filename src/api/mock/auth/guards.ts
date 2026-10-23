import { getCryptoToken } from '@/auth/cryptoSession';
import { getAccessToken } from '@/auth/session';
import type { AccessClaims, CryptoClaims } from '@/auth/types';

import { MOCK_AUTH } from './config';
import { applyKycAutoApprove, getDb, type MockAuthDb, type MockUser, nowSec, saveDb } from './db';
import { fail, verifyJws } from './tokens';

/**
 * middleware заглушки сервера. токены берутся из сессии клиента — так mock
 * имитирует заголовок `Authorization`; коды ошибок те же, что у бэкенда
 */

export type AccessContext = { db: MockAuthDb; claims: AccessClaims; user: MockUser };
export type CryptoContext = { db: MockAuthDb; claims: CryptoClaims; user: MockUser };

export async function requireAccess(): Promise<AccessContext> {
  const db = await getDb();
  const token = getAccessToken();
  if (!token) fail(401, 'TOKEN_INVALID');

  const claims = await verifyJws<AccessClaims>(token, MOCK_AUTH.keys.level1);
  if (!claims) fail(401, 'TOKEN_INVALID');
  if (claims.type !== 'access') fail(401, 'WRONG_TOKEN_TYPE');

  const issued = db.tokens[claims.jti];
  if (!issued) fail(401, 'TOKEN_INVALID');
  if (issued.revoked) fail(403, 'TOKEN_REVOKED');
  if (Math.min(claims.exp, issued.exp) <= nowSec()) fail(401, 'TOKEN_EXPIRED');

  const user = db.users[claims.sub];
  if (!user) fail(401, 'TOKEN_INVALID');
  if (applyKycAutoApprove(user)) saveDb();
  return { db, claims, user };
}

/** crypto-api: принимается только crypto-токен; access здесь не годится */
export async function requireCrypto(): Promise<CryptoContext> {
  const db = await getDb();
  const token = getCryptoToken();
  if (!token) fail(403, 'CRYPTO_AUTH_REQUIRED');

  const claims = await verifyJws<CryptoClaims>(token, MOCK_AUTH.keys.crypto);
  if (!claims) fail(401, 'TOKEN_INVALID');
  if (claims.type !== 'crypto_access' || claims.aud !== 'crypto-api') {
    fail(401, 'WRONG_TOKEN_TYPE');
  }

  // отзыв основной сессии мгновенно делает crypto-токен недействительным
  const session = db.sessions[claims.sid];
  if (!session || session.revoked) fail(403, 'TOKEN_REVOKED');

  const issued = db.tokens[claims.jti];
  const now = Date.now();
  if (
    !issued ||
    issued.revoked ||
    claims.exp <= nowSec() ||
    now - (issued.lastSeen ?? 0) > MOCK_AUTH.cryptoIdleSec * 1000
  ) {
    fail(403, 'CRYPTO_AUTH_REQUIRED');
  }

  const user = db.users[claims.sub];
  if (!user) fail(401, 'TOKEN_INVALID');
  if (user.role !== 'pro' || user.kycStatus !== 'approved') fail(403, 'KYC_REQUIRED');

  // скользящее продление при активности
  issued.lastSeen = now;
  saveDb();
  return { db, claims, user };
}
