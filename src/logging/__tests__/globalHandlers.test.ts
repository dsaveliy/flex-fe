import { AppState } from 'react-native';

import { installGlobalHandlers } from '../globalHandlers';
import { createLogger } from '../logger';
import type { LogBatch } from '../types';

type Handler = (error: unknown, isFatal?: boolean) => void;

describe('installGlobalHandlers', () => {
  let handler: Handler;
  const previous = jest.fn();
  const listeners: ((state: string) => void)[] = [];

  beforeEach(() => {
    handler = previous;
    (globalThis as { ErrorUtils?: unknown }).ErrorUtils = {
      getGlobalHandler: () => handler,
      setGlobalHandler: (next: Handler) => {
        handler = next;
      },
    };
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener as (state: string) => void);
      return { remove: jest.fn() } as never;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  function makeLogger() {
    const batches: LogBatch[] = [];
    const logger = createLogger({
      transport: async (batch) => {
        batches.push(batch);
        return { ok: true };
      },
      sessionId: 'session-1234',
      platform: 'ios',
    });
    return { logger, batches };
  }

  it('необработанное исключение уходит на сервер и передаётся прежнему обработчику', async () => {
    const { logger, batches } = makeLogger();
    const uninstall = installGlobalHandlers(logger);
    const error = new Error('undefined is not a function');

    handler(error, true);
    await logger.flush();

    expect(batches.flatMap((b) => b.entries)).toEqual([
      expect.objectContaining({
        level: 'error',
        message: 'fatal JS error',
        context: expect.objectContaining({ fatal: true, errorMessage: 'undefined is not a function' }),
      }),
    ]);
    expect(previous).toHaveBeenCalledWith(error, true);

    uninstall();
    expect(handler).toBe(previous);
  });

  it('уход приложения в фон отправляет буфер', async () => {
    const { logger, batches } = makeLogger();
    const uninstall = installGlobalHandlers(logger);
    logger.info('opened transfer');
    listeners.at(-1)?.('background');
    await logger.flush();
    expect(batches.flatMap((b) => b.entries.map((e) => e.message))).toContain('opened transfer');
    uninstall();
  });
});
