import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';

import { API_BASE_URL, USE_MOCK_API } from '@/api/config';
import { getAccessToken } from '@/auth/session';

import { createLogger } from './logger';
import { createHttpLogTransport } from './transport';

export { installGlobalHandlers } from './globalHandlers';
export { createLogger, type Logger, type RootLogger } from './logger';
export { redact, safePath } from './redact';
export { createHttpLogTransport } from './transport';
export type * from './types';

const APP_VERSION = Constants.expoConfig?.version ?? 'dev';

/**
 * общий логгер приложения. на сервер уходят info и выше (в dev — и debug),
 * в mock-режиме сервера нет — только консоль. `EXPO_PUBLIC_LOG_LEVEL` меняет порог отправки
 */
export const logger = createLogger({
  transport: USE_MOCK_API
    ? null
    : createHttpLogTransport({ baseUrl: API_BASE_URL, getToken: getAccessToken }),
  sessionId: randomUUID(),
  platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
  appVersion: APP_VERSION,
  sendLevel:
    (process.env.EXPO_PUBLIC_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' | undefined) ??
    (__DEV__ ? 'debug' : 'info'),
  console: __DEV__ && process.env.NODE_ENV !== 'test',
});
