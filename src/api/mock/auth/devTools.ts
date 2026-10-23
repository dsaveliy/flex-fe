import { getDeviceId } from '@/auth/deviceId';
import { decodeJws } from '@/auth/jws';
import { getAccessToken, getRefreshToken } from '@/auth/session';
import type { AccessClaims } from '@/auth/types';

import { type AuthEvent, getDb, nowSec, resetDb, saveDb } from './db';
import { mockAuthApi } from './index';
import { revokeSession } from './tokens';

/**
 * инструменты для ручной проверки сценариев ТЗ (карточка в профиле, только
 * `__DEV__` и mock). каждый действует «на сервере», а реакцию клиента
 * проверяет обычный код приложения
 */

function currentClaims(): AccessClaims | null {
  const token = getAccessToken();
  return token ? (decodeJws<AccessClaims>(token)?.payload ?? null) : null;
}

/** access истекает прямо сейчас: следующий запрос получит TOKEN_EXPIRED и тихо обновится */
export async function expireAccessToken(): Promise<void> {
  const claims = currentClaims();
  if (!claims) return;
  const db = await getDb();
  const issued = db.tokens[claims.jti];
  if (issued) issued.exp = nowSec() - 1;
  saveDb();
}

/**
 * злоумышленник украл refresh и успел им воспользоваться. когда приложение
 * предъявит свой (уже отозванный) refresh, сервер распознает кражу
 */
export async function stealRefreshToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;
  await mockAuthApi.refresh({ refreshToken, deviceId: await getDeviceId() });
}

/** «выйти везде» с другого устройства: семейство токенов отозвано на сервере */
export async function revokeCurrentSession(): Promise<void> {
  const claims = currentClaims();
  if (!claims) return;
  const db = await getDb();
  revokeSession(db, claims.sid);
  saveDb();
}

export async function recentAuthEvents(limit = 6): Promise<AuthEvent[]> {
  const db = await getDb();
  return db.events.slice(0, limit);
}

export { resetDb as resetMockAuthDb };
