/**
 * единый переключатель между mock-данными и настоящим бэкендом.
 * сервис FastAPI пока не готов, поэтому по умолчанию используются mock-данные.
 */
export const USE_MOCK_API = true;

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** диапазон имитируемой сетевой задержки для mock-данных (мс) */
export const MOCK_LATENCY = { min: 300, max: 700 } as const;

/** значение от 0 до 1 позволяет проверять состояния ошибок во время разработки */
export const MOCK_FAILURE_RATE = 0;
