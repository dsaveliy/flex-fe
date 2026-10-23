/**
 * короткие сроки жизни для ручной проверки: access истекает через 30 с
 * (виден тихий refresh), Crypto закрывается после 60 с без действий
 */
export const MOCK_AUTH_SHORT_TTL = false;

const short = __DEV__ && MOCK_AUTH_SHORT_TTL;

/** параметры mock-сервера авторизации; значения по умолчанию — из ТЗ */
export const MOCK_AUTH = {
  issuer: 'flex@auth_service',
  accessTtlSec: short ? 30 : 15 * 60,
  refreshTtlSec: 30 * 24 * 60 * 60,
  cryptoIdleSec: short ? 60 : 10 * 60,
  cryptoMaxSec: short ? 3 * 60 : 30 * 60,
  /** вход: 5 неудач за 15 минут на аккаунт и на IP → временная блокировка */
  login: { maxFailures: 5, windowSec: 15 * 60 },
  /** второй фактор: 3 ошибки → 15 минут блокировки, 10 подряд → только через поддержку */
  factor: { perLock: 3, lockSec: 15 * 60, hardLimit: 10 },
  /** код подтверждения телефона и email */
  otpCode: '000000',
  /** через сколько «администратор» одобряет KYC */
  kycApproveDelaySec: 5,
  /** очистка просроченных записей issued_tokens */
  purgeEverySec: 60 * 60,
  /** ключи подписи: отдельный kid для Уровня 2 (в проде — RS256/EdDSA из менеджера секретов) */
  keys: {
    level1: { kid: 'mock-l1', secret: 'mock-level1-secret' },
    crypto: { kid: 'mock-crypto', secret: 'mock-crypto-secret' },
  },
  /** вместо проверки по базе утёкших паролей */
  leakedPasswords: ['password1234', 'qwerty123456', '123456789012', 'qwertyuiop12'],
  demoPassword: 'FlexDemo2026!',
} as const;

export type SigningKey = { kid: string; secret: string };
