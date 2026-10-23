const KEY = 'flex.mock-auth-db';

/** web: состояние mock-авторизации в localStorage */
export function loadSnapshot(): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function saveSnapshot(json: string): void {
  try {
    globalThis.localStorage?.setItem(KEY, json);
  } catch {
    // приватный режим — живём в памяти
  }
}

export function clearSnapshot(): void {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // нечего удалять
  }
}
