import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';

import type { KycStatus, Role, VerificationChannel } from '../../types';
import { MOCK_AUTH } from './config';
import { clearSnapshot, loadSnapshot, saveSnapshot } from './persist';

/* таблицы из раздела 10 ТЗ: users, devices (knownDevices), issued_tokens, user_factors, auth_events */

export type MockUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** в проде Argon2id; здесь SHA-256 с солью — только для заглушки */
  passwordHash: string;
  salt: string;
  role: Role;
  kycStatus: KycStatus;
  kycSubmittedAt: number | null;
  verified: Record<VerificationChannel, boolean>;
  knownDevices: string[];
  /** user_factors */
  pinHash: string | null;
  /** deviceId → хеш секрета биометрии этого устройства */
  biometric: Record<string, string>;
  factorFailStreak: number;
  factorFailTotal: number;
  factorLockedUntil: number | null;
  cryptoBlocked: boolean;
};

export type TokenType = 'access' | 'refresh' | 'crypto_access';

/** issued_tokens: jti (PK), subject, device_id, type, revoked, expired_time (UNIX) */
export type IssuedToken = {
  jti: string;
  sub: string;
  deviceId: string;
  sid: string;
  type: TokenType;
  revoked: boolean;
  exp: number;
  /** crypto: последняя активность (мс) для скользящего таймаута */
  lastSeen?: number;
};

/** вход на устройстве: семейство токенов, которое отзывается целиком */
export type MockSession = {
  sid: string;
  userId: string;
  deviceId: string;
  revoked: boolean;
  createdAt: number;
};

export type Verification = { id: string; userId: string; remaining: VerificationChannel[] };

/** auth_events — журнал событий безопасности; уведомления клиенту помечены `notify` */
export type AuthEvent = {
  at: string;
  type: string;
  userId?: string;
  deviceId?: string;
  notify?: boolean;
};

export type MockAuthDb = {
  users: Record<string, MockUser>;
  tokens: Record<string, IssuedToken>;
  sessions: Record<string, MockSession>;
  verifications: Record<string, Verification>;
  /** ключ (`id:…` или `ip:…`) → время неудачных входов, мс */
  loginFailures: Record<string, number[]>;
  events: AuthEvent[];
  lastPurge: number;
};

export async function hashSecret(value: string, salt: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${value}`);
}

export const nowSec = () => Math.floor(Date.now() / 1000);

async function seedUser(
  partial: Pick<
    MockUser,
    'id' | 'firstName' | 'lastName' | 'phone' | 'email' | 'role' | 'kycStatus'
  >,
): Promise<MockUser> {
  const salt = randomUUID();
  return {
    ...partial,
    salt,
    passwordHash: await hashSecret(MOCK_AUTH.demoPassword, salt),
    kycSubmittedAt: null,
    verified: { phone: true, email: true },
    knownDevices: [],
    pinHash: null,
    biometric: {},
    factorFailStreak: 0,
    factorFailTotal: 0,
    factorLockedUntil: null,
    cryptoBlocked: false,
  };
}

/** демо-аккаунты: Basic без KYC и Pro с одобренным KYC (PIN задаётся при первом входе в Crypto) */
async function seed(): Promise<MockAuthDb> {
  const basic = await seedUser({
    id: 'usr_basic',
    firstName: 'Анна',
    lastName: 'Ковалёва',
    phone: '+375291112233',
    email: 'basic@flex.by',
    role: 'basic',
    kycStatus: 'none',
  });
  const pro = await seedUser({
    id: 'usr_1',
    firstName: 'Роман',
    lastName: 'Понявин',
    phone: '+375447654321',
    email: 'pro@flex.by',
    role: 'pro',
    kycStatus: 'approved',
  });
  return {
    users: { [basic.id]: basic, [pro.id]: pro },
    tokens: {},
    sessions: {},
    verifications: {},
    loginFailures: {},
    events: [],
    lastPurge: Date.now(),
  };
}

let db: MockAuthDb | null = null;
let loading: Promise<MockAuthDb> | null = null;

/** планировщик из ТЗ: удаляет записи с истёкшим `exp` */
function purgeExpired(target: MockAuthDb): void {
  const now = nowSec();
  for (const [jti, token] of Object.entries(target.tokens)) {
    if (token.exp < now) delete target.tokens[jti];
  }
  target.lastPurge = Date.now();
}

export async function getDb(): Promise<MockAuthDb> {
  if (db) {
    if (Date.now() - db.lastPurge > MOCK_AUTH.purgeEverySec * 1000) {
      purgeExpired(db);
      saveDb();
    }
    return db;
  }
  loading ??= (async () => {
    const snapshot = loadSnapshot();
    let loaded: MockAuthDb | null = null;
    if (snapshot) {
      try {
        loaded = JSON.parse(snapshot) as MockAuthDb;
      } catch {
        loaded = null;
      }
    }
    db = loaded ?? (await seed());
    purgeExpired(db);
    saveDb();
    return db;
  })();
  return loading;
}

export function saveDb(): void {
  if (db) saveSnapshot(JSON.stringify(db));
}

export async function resetDb(): Promise<void> {
  clearSnapshot();
  db = null;
  loading = null;
  await getDb();
}

export function logEvent(target: MockAuthDb, event: Omit<AuthEvent, 'at'>): void {
  target.events.unshift({ at: new Date().toISOString(), ...event });
  target.events.length = Math.min(target.events.length, 200);
  if (event.notify && __DEV__) console.info(`[mock-auth] уведомление клиенту: ${event.type}`);
}

export function findUserByIdentifier(target: MockAuthDb, identifier: string): MockUser | null {
  return (
    Object.values(target.users).find(
      (user) => user.email === identifier || user.phone === identifier,
    ) ?? null
  );
}

/** «администратор» одобряет заявку через несколько секунд после подачи */
export function applyKycAutoApprove(user: MockUser): boolean {
  if (
    user.kycStatus === 'pending' &&
    user.kycSubmittedAt !== null &&
    Date.now() - user.kycSubmittedAt >= MOCK_AUTH.kycApproveDelaySec * 1000
  ) {
    user.kycStatus = 'approved';
    user.role = 'pro';
    return true;
  }
  return false;
}
