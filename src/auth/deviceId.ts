import { randomUUID } from 'expo-crypto';

import { SECURE_KEYS, secureStorage } from './secureStorage';

let cached: string | null = null;

/**
 * постоянный id установки приложения (UUID v4). генерируется один раз и
 * хранится в защищённом хранилище; это не рекламный идентификатор
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const stored = await secureStorage.get(SECURE_KEYS.deviceId);
  if (stored) {
    cached = stored;
    return stored;
  }
  const created = randomUUID();
  await secureStorage.set(SECURE_KEYS.deviceId, created);
  cached = created;
  return created;
}
