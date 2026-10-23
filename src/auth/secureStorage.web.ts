/**
 * web-вариант: Keychain нет, поэтому localStorage. в проде refresh на web
 * будет в httpOnly-cookie (выставляет сервер), а биометрии на web нет.
 */
export const SECURE_KEYS = {
  refreshToken: 'flex.auth.refresh',
  deviceId: 'flex.auth.device-id',
  biometricCredential: 'flex.crypto.bio-credential',
  biometricEnabled: 'flex.crypto.bio-enabled',
} as const;

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export const secureStorage = {
  get: async (key: string) => storage()?.getItem(key) ?? null,
  set: async (key: string, value: string) => storage()?.setItem(key, value),
  remove: async (key: string) => storage()?.removeItem(key),
  canUseBiometric: () => false,
  setBiometric: async (_key: string, _value: string) => {},
  getBiometric: async (_key: string, _prompt: string): Promise<string | null> => null,
};
