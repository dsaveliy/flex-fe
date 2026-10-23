import { randomUUID } from 'expo-crypto';

import {
  isValidEmail,
  isValidPhone,
  isValidPin,
  normalizeEmail,
  normalizeIdentifier,
  normalizePhone,
  PASSWORD_MIN_LENGTH,
} from '@/auth/validation';
import type { AccessClaims } from '@/auth/types';

import type {
  CryptoAccessStatus,
  CryptoBiometricRequest,
  CryptoBiometricResponse,
  CryptoLoginRequest,
  CryptoSession,
  CryptoSetupRequest,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  TokenPair,
  VerificationChannel,
  VerifyContactRequest,
  VerifyContactResponse,
} from '../../types';
import { respond } from '../delay';
import { MOCK_AUTH } from './config';
import {
  findUserByIdentifier,
  getDb,
  hashSecret,
  logEvent,
  type MockAuthDb,
  type MockUser,
  nowSec,
  saveDb,
} from './db';
import { requireAccess, requireCrypto } from './guards';
import {
  fail,
  issueCryptoToken,
  issuePair,
  revokeSession,
  revokeTokens,
  verifyJws,
} from './tokens';

/** в mock все запросы приходят «с одного IP» */
const CLIENT_IP = 'ip:local';

function createVerification(db: MockAuthDb, user: MockUser): RegisterResponse {
  const remaining = (['phone', 'email'] as VerificationChannel[]).filter(
    (channel) => !user.verified[channel],
  );
  const id = randomUUID();
  db.verifications[id] = { id, userId: user.id, remaining };
  logEvent(db, { type: 'otp_sent', userId: user.id });
  return { verificationId: id, channels: remaining };
}

/** скользящее окно неудачных входов; при превышении — 429 с Retry-After */
function checkLoginLimit(db: MockAuthDb, keys: string[]): void {
  const now = Date.now();
  const windowMs = MOCK_AUTH.login.windowSec * 1000;
  for (const key of keys) {
    const recent = (db.loginFailures[key] ?? []).filter((at) => now - at < windowMs);
    db.loginFailures[key] = recent;
    if (recent.length >= MOCK_AUTH.login.maxFailures) {
      fail(429, 'TOO_MANY_ATTEMPTS', {
        retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000),
      });
    }
  }
}

function cryptoStatus(user: MockUser, deviceId: string): CryptoAccessStatus {
  const lockedUntil =
    user.factorLockedUntil !== null && user.factorLockedUntil > Date.now()
      ? new Date(user.factorLockedUntil).toISOString()
      : null;
  return {
    role: user.role,
    kycStatus: user.kycStatus,
    factorConfigured: user.pinHash !== null,
    biometricEnabled: Boolean(user.biometric[deviceId]),
    lockedUntil,
    blocked: user.cryptoBlocked,
  };
}

/**
 * заглушка сервиса авторизации FastAPI (docs/auth.md). сигнатуры совпадают
 * с `FlexApi`, поэтому `services.ts` подменяет реализацию одной строкой
 */
export const mockAuthApi = {
  async register(body: RegisterRequest): Promise<RegisterResponse> {
    const db = await getDb();
    const phone = normalizePhone(body.phone);
    const email = normalizeEmail(body.email);
    if (!isValidPhone(phone)) fail(422, 'PHONE_INVALID');
    if (!isValidEmail(email)) fail(422, 'EMAIL_INVALID');
    if (body.password.length < PASSWORD_MIN_LENGTH) fail(422, 'PASSWORD_WEAK');
    if ((MOCK_AUTH.leakedPasswords as readonly string[]).includes(body.password.toLowerCase())) {
      fail(422, 'PASSWORD_LEAKED');
    }
    const users = Object.values(db.users);
    if (users.some((user) => user.phone === phone)) fail(409, 'PHONE_TAKEN');
    if (users.some((user) => user.email === email)) fail(409, 'EMAIL_TAKEN');

    const salt = randomUUID();
    const user: MockUser = {
      id: `usr_${randomUUID().slice(0, 8)}`,
      firstName: email.split('@')[0],
      lastName: '',
      phone,
      email,
      salt,
      passwordHash: await hashSecret(body.password, salt),
      role: 'basic',
      kycStatus: 'none',
      kycSubmittedAt: null,
      verified: { phone: false, email: false },
      knownDevices: [],
      pinHash: null,
      biometric: {},
      factorFailStreak: 0,
      factorFailTotal: 0,
      factorLockedUntil: null,
      cryptoBlocked: false,
    };
    db.users[user.id] = user;
    logEvent(db, { type: 'register', userId: user.id });
    const result = createVerification(db, user);
    saveDb();
    return respond(result);
  },

  async verifyContact(body: VerifyContactRequest): Promise<VerifyContactResponse> {
    const db = await getDb();
    const verification = db.verifications[body.verificationId];
    if (!verification) fail(404, 'VERIFICATION_NOT_FOUND');
    if (body.code !== MOCK_AUTH.otpCode) fail(400, 'OTP_INVALID');

    const user = db.users[verification.userId];
    if (user) user.verified[body.channel] = true;
    verification.remaining = verification.remaining.filter((channel) => channel !== body.channel);
    if (verification.remaining.length === 0) delete db.verifications[verification.id];
    saveDb();
    return respond({ remaining: verification.remaining });
  },

  async resendCode(body: { verificationId: string; channel: VerificationChannel }): Promise<void> {
    const db = await getDb();
    const verification = db.verifications[body.verificationId];
    if (!verification) fail(404, 'VERIFICATION_NOT_FOUND');
    logEvent(db, { type: `otp_resent_${body.channel}`, userId: verification.userId });
    saveDb();
    return respond(undefined);
  },

  async login(body: LoginRequest): Promise<TokenPair> {
    const db = await getDb();
    const identifier = normalizeIdentifier(body.identifier);
    const limitKeys = [`id:${identifier}`, CLIENT_IP];
    checkLoginLimit(db, limitKeys);

    const user = findUserByIdentifier(db, identifier);
    const ok = user !== null && (await hashSecret(body.password, user.salt)) === user.passwordHash;
    if (!user || !ok) {
      // один ответ на неверный логин и неверный пароль
      for (const key of limitKeys) db.loginFailures[key] = [...db.loginFailures[key], Date.now()];
      logEvent(db, { type: 'login_failed', userId: user?.id, deviceId: body.deviceId });
      saveDb();
      await respond(undefined);
      fail(401, 'INVALID_CREDENTIALS');
    }

    if (!user.verified.phone || !user.verified.email) {
      const { verificationId, channels } = createVerification(db, user);
      saveDb();
      fail(403, 'CONTACT_NOT_VERIFIED', { details: { verificationId, channels } });
    }

    for (const key of limitKeys) delete db.loginFailures[key];
    if (!user.knownDevices.includes(body.deviceId)) {
      user.knownDevices.push(body.deviceId);
      logEvent(db, { type: 'new_device', userId: user.id, deviceId: body.deviceId, notify: true });
    }
    // повторный вход на том же устройстве заменяет прежнее семейство, другие устройства не трогаем
    for (const session of Object.values(db.sessions)) {
      if (session.userId === user.id && session.deviceId === body.deviceId && !session.revoked) {
        revokeSession(db, session.sid);
      }
    }
    const sid = randomUUID();
    db.sessions[sid] = {
      sid,
      userId: user.id,
      deviceId: body.deviceId,
      revoked: false,
      createdAt: Date.now(),
    };
    const pair = await issuePair(db, user, sid, body.deviceId);
    logEvent(db, { type: 'login', userId: user.id, deviceId: body.deviceId });
    saveDb();
    return respond(pair);
  },

  async refresh(body: RefreshRequest): Promise<TokenPair> {
    const db = await getDb();
    const claims = await verifyJws<AccessClaims>(body.refreshToken, MOCK_AUTH.keys.level1);
    if (!claims) fail(401, 'TOKEN_INVALID');
    if (claims.type !== 'refresh') fail(401, 'WRONG_TOKEN_TYPE');

    const issued = db.tokens[claims.jti];
    if (!issued) fail(401, 'TOKEN_INVALID');
    if (issued.revoked) {
      // повторное предъявление отозванного refresh = кража: отзываем всё семейство
      revokeSession(db, claims.sid);
      logEvent(db, {
        type: 'refresh_reuse_detected',
        userId: claims.sub,
        deviceId: claims.device_id,
        notify: true,
      });
      saveDb();
      fail(403, 'TOKEN_REVOKED');
    }
    if (claims.device_id !== body.deviceId) fail(401, 'TOKEN_INVALID');
    if (claims.exp <= nowSec()) fail(401, 'TOKEN_EXPIRED');

    const session = db.sessions[claims.sid];
    const user = db.users[claims.sub];
    if (!session || session.revoked || !user) fail(403, 'TOKEN_REVOKED');

    // ротация: старые access и refresh этого устройства отзываются, crypto-сессия живёт
    revokeTokens(db, claims.sid, ['access', 'refresh']);
    const pair = await issuePair(db, user, claims.sid, claims.device_id);
    logEvent(db, { type: 'refresh', userId: user.id, deviceId: claims.device_id });
    saveDb();
    return respond(pair);
  },

  async logout(): Promise<void> {
    const { db, claims } = await requireAccess();
    revokeSession(db, claims.sid);
    logEvent(db, { type: 'logout', userId: claims.sub, deviceId: claims.device_id });
    saveDb();
    return respond(undefined);
  },

  async getCryptoAccess(params: { deviceId: string }): Promise<CryptoAccessStatus> {
    const { user } = await requireAccess();
    return respond(cryptoStatus(user, params.deviceId));
  },

  async submitKyc(): Promise<void> {
    const { db, user } = await requireAccess();
    if (user.kycStatus !== 'approved') {
      user.kycStatus = 'pending';
      user.kycSubmittedAt = Date.now();
      logEvent(db, { type: 'kyc_submitted', userId: user.id });
      saveDb();
    }
    return respond(undefined);
  },

  async cryptoSetup(body: CryptoSetupRequest): Promise<void> {
    const { db, user } = await requireAccess();
    if (user.role !== 'pro' || user.kycStatus !== 'approved') fail(403, 'KYC_REQUIRED');
    // смена уже заданного фактора — критичная операция, в первой версии её нет
    if (user.pinHash) fail(409, 'CRYPTO_ALREADY_CONFIGURED');
    if (!isValidPin(body.pin)) fail(422, 'PIN_INVALID');
    user.pinHash = await hashSecret(body.pin, user.salt);
    logEvent(db, { type: 'factor_set', userId: user.id, deviceId: body.deviceId, notify: true });
    saveDb();
    return respond(undefined);
  },

  async cryptoLogin(body: CryptoLoginRequest): Promise<CryptoSession> {
    const { db, claims, user } = await requireAccess();
    await respond(undefined);
    if (claims.device_id !== body.deviceId) fail(401, 'TOKEN_INVALID');
    if (user.role !== 'pro' || user.kycStatus !== 'approved') fail(403, 'KYC_REQUIRED');
    if (user.cryptoBlocked) fail(403, 'CRYPTO_LOCKED');
    if (user.factorLockedUntil !== null && user.factorLockedUntil > Date.now()) {
      fail(429, 'TOO_MANY_ATTEMPTS', {
        retryAfter: Math.ceil((user.factorLockedUntil - Date.now()) / 1000),
      });
    }
    if (!user.pinHash) fail(403, 'CRYPTO_SETUP_REQUIRED');

    const { factor } = body;
    const expected = factor.type === 'pin' ? user.pinHash : user.biometric[body.deviceId];
    const provided = factor.type === 'pin' ? factor.pin : factor.credential;
    const ok = Boolean(expected) && (await hashSecret(provided, user.salt)) === expected;

    if (!ok) {
      user.factorFailStreak += 1;
      user.factorFailTotal += 1;
      logEvent(db, { type: 'factor_failed', userId: user.id, deviceId: body.deviceId });
      if (user.factorFailTotal >= MOCK_AUTH.factor.hardLimit) {
        user.cryptoBlocked = true;
        logEvent(db, { type: 'crypto_blocked', userId: user.id, notify: true });
        saveDb();
        fail(403, 'CRYPTO_LOCKED');
      }
      if (user.factorFailStreak >= MOCK_AUTH.factor.perLock) {
        user.factorFailStreak = 0;
        user.factorLockedUntil = Date.now() + MOCK_AUTH.factor.lockSec * 1000;
        logEvent(db, { type: 'crypto_locked_temporarily', userId: user.id, notify: true });
        saveDb();
        fail(429, 'TOO_MANY_ATTEMPTS', { retryAfter: MOCK_AUTH.factor.lockSec });
      }
      saveDb();
      fail(401, 'FACTOR_INVALID', {
        attemptsLeft: MOCK_AUTH.factor.perLock - user.factorFailStreak,
      });
    }

    user.factorFailStreak = 0;
    user.factorFailTotal = 0;
    user.factorLockedUntil = null;
    // одна криптосессия на устройство
    revokeTokens(db, claims.sid, ['crypto_access']);
    const session = await issueCryptoToken(db, claims, [
      'pwd',
      factor.type === 'pin' ? 'pin' : 'bio',
    ]);
    logEvent(db, { type: 'crypto_login', userId: user.id, deviceId: body.deviceId, notify: true });
    saveDb();
    return session;
  },

  async cryptoLogout(): Promise<void> {
    const { db, claims } = await requireCrypto();
    const issued = db.tokens[claims.jti];
    if (issued) issued.revoked = true;
    logEvent(db, { type: 'crypto_logout', userId: claims.sub, deviceId: claims.device_id });
    saveDb();
    return respond(undefined);
  },

  async setCryptoBiometric(body: CryptoBiometricRequest): Promise<CryptoBiometricResponse> {
    const { db, claims, user } = await requireCrypto();
    if (claims.device_id !== body.deviceId) fail(401, 'TOKEN_INVALID');
    let credential: string | null = null;
    if (body.enabled) {
      credential = `${randomUUID()}${randomUUID()}`;
      user.biometric[body.deviceId] = await hashSecret(credential, user.salt);
    } else {
      delete user.biometric[body.deviceId];
    }
    logEvent(db, {
      type: body.enabled ? 'biometric_enabled' : 'biometric_disabled',
      userId: user.id,
      deviceId: body.deviceId,
      notify: true,
    });
    saveDb();
    return respond({ credential });
  },
};
