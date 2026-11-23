/** уровни по возрастанию важности; сервер принимает те же (flex-be: app/schemas/client_logs.py) */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogContext = Record<string, unknown>;

/** одна запись — как её ждёт `POST /api/v1/client-logs` */
export type LogEntry = {
  ts: string;
  level: LogLevel;
  /** подсистема: app, api, auth, chat, ui, nav… */
  source: string;
  message: string;
  context?: LogContext;
  stack?: string;
  /** маршрут expo-router в момент записи */
  screen?: string;
};

export type LogBatch = {
  sessionId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  entries: LogEntry[];
};

/** результат отправки: `retryAfterMs` — сервер попросил подождать (429) */
export type SendResult = { ok: true } | { ok: false; retryAfterMs?: number };

export type LogTransport = (batch: LogBatch) => Promise<SendResult>;

export function levelRank(level: LogLevel): number {
  return LOG_LEVELS.indexOf(level);
}
