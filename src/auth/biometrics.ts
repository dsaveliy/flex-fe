import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { SECURE_KEYS, secureStorage } from './secureStorage';

export type BiometryKind = 'faceId' | 'touchId' | 'biometrics';

/** какая биометрия доступна и настроена; `null` — нет (или web) */
export async function getBiometryKind(): Promise<BiometryKind | null> {
  if (Platform.OS === 'web') return null;
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hardware || !enrolled || !secureStorage.canUseBiometric()) return null;
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (Platform.OS !== 'ios') return 'biometrics';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'faceId';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'touchId';
    return 'biometrics';
  } catch {
    return null;
  }
}

/**
 * секрет устройства для входа в Crypto по биометрии. сервер выдаёт его при
 * включении Face ID, а Keychain отдаёт только после успешного Face ID.
 * в проде — подпись challenge ключом из Secure Enclave (docs/auth.md)
 */
export async function saveBiometricCredential(credential: string): Promise<void> {
  await secureStorage.setBiometric(SECURE_KEYS.biometricCredential, credential);
  await secureStorage.set(SECURE_KEYS.biometricEnabled, '1');
}

/** есть ли секрет на устройстве — без запроса Face ID */
export async function hasBiometricCredential(): Promise<boolean> {
  return (await secureStorage.get(SECURE_KEYS.biometricEnabled)) === '1';
}

/** системный запрос Face ID; `null` — отмена или биометрия изменилась */
export function readBiometricCredential(prompt: string): Promise<string | null> {
  return secureStorage.getBiometric(SECURE_KEYS.biometricCredential, prompt);
}

export async function clearBiometricCredential(): Promise<void> {
  await secureStorage.remove(SECURE_KEYS.biometricCredential);
  await secureStorage.remove(SECURE_KEYS.biometricEnabled);
}
