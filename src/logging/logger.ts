import { redact } from './redact';
import {
  type LogBatch,
  type LogContext,
  type LogEntry,
  type LogLevel,
  levelRank,
  type LogTransport,
} from './types';

export type LoggerOptions = {
  transport: LogTransport | null;
  sessionId: string;
  platform: LogBatch['platform'];
  appVersion?: string;
  /** ниже этого уровня запись не создаётся вовсе */
  minLevel?: LogLevel;
  /** ниже этого уровня запись видна только в консоли и на сервер не уходит */
  sendLevel?: LogLevel;
  /** записей в одной отправке (сервер принимает до 50) */
  batchSize?: number;
  /** как часто отправлять накопленное */
  flushIntervalMs?: number;
  /** сколько держать в памяти, пока сервер недоступен; старые вытесняются */
  maxBuffer?: number;
  /** дублировать в console (в dev) */
  console?: boolean;
  now?: () => Date;
};

export type Logger = {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  /** `error` может быть Error: стек уходит отдельным полем */
  error(message: string, error?: unknown, context?: LogContext): void;
  /** логгер подсистемы: `logger.child('chat').warn(...)` */
  child(source: string): Logger;
};

export type RootLogger = Logger & {
  flush(): Promise<void>;
  setScreen(screen: string | undefined): void;
  /** сколько записей ждут отправки и сколько вытеснено — для отладки и тестов */
  stats(): { pending: number; dropped: number; sent: number };
  start(): void;
  stop(): void;
};

const CONSOLE: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...a) => console.debug(...a),
  info: (...a) => console.info(...a),
  warn: (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
};

/**
 * логгер клиента: записи копятся в буфере и уходят на сервер пачками —
 * по таймеру, при заполнении пачки, сразу при ошибке и при уходе приложения в фон.
 * при сбое сети пачка возвращается в начало очереди, переполнение вытесняет самые старые
 */
export function createLogger(options: LoggerOptions): RootLogger {
  const {
    transport,
    sessionId,
    platform,
    appVersion,
    minLevel = 'debug',
    sendLevel = 'info',
    batchSize = 20,
    flushIntervalMs = 10_000,
    maxBuffer = 200,
    console: toConsole = false,
    now = () => new Date(),
  } = options;

  let queue: LogEntry[] = [];
  let screen: string | undefined;
  let dropped = 0;
  let sent = 0;
  let pausedUntil = 0;
  let flushing: Promise<void> | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  function enqueue(entry: LogEntry) {
    queue.push(entry);
    if (queue.length > maxBuffer) {
      dropped += queue.length - maxBuffer;
      queue = queue.slice(queue.length - maxBuffer);
    }
  }

  async function sendAll(): Promise<void> {
    if (!transport) {
      queue = [];
      return;
    }
    while (queue.length > 0) {
      if (now().getTime() < pausedUntil) return;
      const entries = queue.slice(0, batchSize);
      queue = queue.slice(entries.length);
      let result: Awaited<ReturnType<LogTransport>>;
      try {
        result = await transport({ sessionId, platform, appVersion, entries });
      } catch {
        result = { ok: false };
      }
      if (!result.ok) {
        // вернуть в начало: порядок записей сохраняется, лишнее вытеснится в enqueue
        queue = [...entries, ...queue];
        if (queue.length > maxBuffer) {
          dropped += queue.length - maxBuffer;
          queue = queue.slice(queue.length - maxBuffer);
        }
        pausedUntil = now().getTime() + (result.retryAfterMs ?? flushIntervalMs);
        return;
      }
      sent += entries.length;
    }
  }

  function flush(): Promise<void> {
    if (!flushing) {
      flushing = sendAll().finally(() => {
        flushing = null;
      });
    }
    return flushing;
  }

  function write(level: LogLevel, source: string, message: string, context?: LogContext, error?: unknown) {
    if (levelRank(level) < levelRank(minLevel)) return;

    const stack = error instanceof Error ? error.stack : undefined;
    const errorFields =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message }
        : error !== undefined
          ? { error: String(error) }
          : undefined;
    const entry: LogEntry = {
      ts: now().toISOString(),
      level,
      source,
      message,
      context: redact(errorFields ? { ...context, ...errorFields } : context),
      stack: stack?.slice(0, 8000),
      screen,
    };

    if (toConsole) CONSOLE[level](`[${source}] ${message}`, entry.context ?? '');
    if (levelRank(level) < levelRank(sendLevel)) return;

    enqueue(entry);
    // ошибку отправляем сразу: приложение может тут же упасть
    if (level === 'error' || queue.length >= batchSize) void flush();
  }

  function make(source: string): Logger {
    return {
      debug: (message, context) => write('debug', source, message, context),
      info: (message, context) => write('info', source, message, context),
      warn: (message, context) => write('warn', source, message, context),
      error: (message, error, context) => write('error', source, message, context, error),
      child: (child) => make(child),
    };
  }

  return {
    ...make('app'),
    flush,
    setScreen: (value) => {
      screen = value;
    },
    stats: () => ({ pending: queue.length, dropped, sent }),
    start: () => {
      if (!timer && transport) timer = setInterval(() => void flush(), flushIntervalMs);
    },
    stop: () => {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
