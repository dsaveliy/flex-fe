/**
 * адрес бэкенда FastAPI, например `https://flex.example.com/api/v1`.
 * веб-версия на том же домене собирается с `/api/v1`. переменная подставляется
 * при сборке (`.env`, `eas.json`), поэтому после правки нужен перезапуск Metro
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * единый переключатель между mock-данными и настоящим бэкендом:
 * mock, пока адрес не задан, или явно `EXPO_PUBLIC_USE_MOCK=1`
 */
export const USE_MOCK_API = !API_BASE_URL || process.env.EXPO_PUBLIC_USE_MOCK === '1';

/**
 * чат на mock-сервере, даже когда остальное API настоящее: пока на бэкенде нет
 * WebSocket чата (docs/chat.md), `EXPO_PUBLIC_CHAT_MOCK=1` позволяет смотреть чат со своим аккаунтом
 */
export const USE_MOCK_CHAT = USE_MOCK_API || process.env.EXPO_PUBLIC_CHAT_MOCK === '1';

/** диапазон имитируемой сетевой задержки для mock-данных (мс) */
export const MOCK_LATENCY = { min: 300, max: 700 } as const;

/** значение от 0 до 1 позволяет проверять состояния ошибок во время разработки */
export const MOCK_FAILURE_RATE = 0;
