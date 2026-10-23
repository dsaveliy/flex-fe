import * as SecureStore from 'expo-secure-store';

/** ключи защищённого хранилища (Keychain на iOS, Keystore на Android) */
export const SECURE_KEYS = {
  refreshToken: 'flex.auth.refresh',
  deviceId: 'flex.auth.device-id',
  /** секрет входа в Crypto по биометрии; читается только после Face ID */
  biometricCredential: 'flex.crypto.bio-credential',
  /** флаг без защиты: позволяет узнать о секрете, не вызывая Face ID */
  biometricEnabled: 'flex.crypto.bio-enabled',
} as const;

const PLAIN: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  get: (key: string) => SecureStore.getItemAsync(key, PLAIN),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value, PLAIN),
  remove: (key: string) => SecureStore.deleteItemAsync(key, PLAIN),

  /** можно ли хранить значения за биометрией */
  canUseBiometric: () => SecureStore.canUseBiometricAuthentication(),

  /** значение, доступное только после Face ID / Touch ID; пропадает при смене биометрии */
  setBiometric: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value, {
      requireAuthentication: true,
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    }),

  /** вызывает системный запрос Face ID; `null`, если пользователь отменил */
  getBiometric: async (key: string, prompt: string) => {
    try {
      return await SecureStore.getItemAsync(key, {
        requireAuthentication: true,
        authenticationPrompt: prompt,
        keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      });
    } catch {
      return null;
    }
  },
};
