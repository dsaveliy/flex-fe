import { File, Paths } from 'expo-file-system';

/**
 * «диск сервера»: состояние mock-авторизации переживает перезапуск Metro,
 * иначе refresh из Keychain после перезагрузки был бы неизвестен серверу
 */
function file(): File {
  return new File(Paths.document, 'flex-mock-auth.json');
}

export function loadSnapshot(): string | null {
  try {
    const target = file();
    return target.exists ? target.textSync() : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(json: string): void {
  try {
    const target = file();
    if (!target.exists) target.create();
    target.write(json);
  } catch (error) {
    console.warn('[mock-auth] save failed', error);
  }
}

export function clearSnapshot(): void {
  try {
    const target = file();
    if (target.exists) target.delete();
  } catch {
    // нечего удалять
  }
}
