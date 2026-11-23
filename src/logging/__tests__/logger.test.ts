import { createLogger } from '../logger';
import type { LogBatch, LogTransport } from '../types';

const NOW = new Date('2026-11-24T10:00:00.000Z');

function setup(overrides: Partial<Parameters<typeof createLogger>[0]> = {}) {
  const batches: LogBatch[] = [];
  const transport = jest.fn<ReturnType<LogTransport>, Parameters<LogTransport>>(async (batch) => {
    batches.push(batch);
    return { ok: true };
  });
  let clock = NOW.getTime();
  const logger = createLogger({
    transport,
    sessionId: 'session-1234',
    platform: 'web',
    appVersion: '1.0.0',
    batchSize: 3,
    flushIntervalMs: 5_000,
    now: () => new Date(clock),
    ...overrides,
  });
  return { logger, transport, batches, tick: (ms: number) => (clock += ms) };
}

describe('createLogger', () => {
  it('копит записи и отправляет одной пачкой с метаданными сессии', async () => {
    const { logger, batches } = setup();
    logger.info('app started');
    logger.child('api').warn('GET /me 401 TOKEN_EXPIRED', { status: 401 });
    expect(batches).toHaveLength(0);

    await logger.flush();
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ sessionId: 'session-1234', platform: 'web', appVersion: '1.0.0' });
    expect(batches[0].entries).toEqual([
      { ts: NOW.toISOString(), level: 'info', source: 'app', message: 'app started' },
      {
        ts: NOW.toISOString(),
        level: 'warn',
        source: 'api',
        message: 'GET /me 401 TOKEN_EXPIRED',
        context: { status: 401 },
      },
    ]);
    expect(logger.stats()).toEqual({ pending: 0, dropped: 0, sent: 2 });
  });

  it('debug не уходит на сервер при sendLevel=info, но и не ломает очередь', async () => {
    const { logger, transport } = setup({ sendLevel: 'info' });
    logger.debug('GET /markets 200');
    await logger.flush();
    expect(transport).not.toHaveBeenCalled();
  });

  it('ниже minLevel запись не создаётся вовсе', async () => {
    const { logger } = setup({ minLevel: 'warn' });
    logger.info('noise');
    expect(logger.stats().pending).toBe(0);
  });

  it('ошибка отправляется сразу, вместе со стеком и подставленным экраном', async () => {
    const { logger, batches } = setup();
    logger.setScreen('/transfer');
    logger.child('ui').error('render error', new Error('boom'), { component: 'TransferForm' });
    await Promise.resolve();
    await logger.flush();

    const [entry] = batches[0].entries;
    expect(entry).toMatchObject({
      level: 'error',
      source: 'ui',
      screen: '/transfer',
      context: { component: 'TransferForm', errorName: 'Error', errorMessage: 'boom' },
    });
    expect(entry.stack).toContain('boom');
  });

  it('заполненная пачка уходит без ожидания таймера, по batchSize записей', async () => {
    const { logger, batches } = setup();
    for (let i = 0; i < 4; i += 1) logger.info(`event ${i}`);
    await logger.flush();
    expect(batches.map((b) => b.entries.length)).toEqual([3, 1]);
  });

  it('при сбое сети пачка возвращается в очередь и уходит позже в том же порядке', async () => {
    const { logger, transport, batches, tick } = setup();
    transport.mockResolvedValueOnce({ ok: false });
    logger.info('first');
    logger.info('second');

    await logger.flush();
    expect(logger.stats().pending).toBe(2);

    // до конца паузы повторов нет
    await logger.flush();
    expect(transport).toHaveBeenCalledTimes(1);

    tick(5_000);
    await logger.flush();
    expect(batches.at(-1)?.entries.map((e) => e.message)).toEqual(['first', 'second']);
  });

  it('уважает Retry-After сервера (429)', async () => {
    const { logger, transport, tick } = setup();
    transport.mockResolvedValueOnce({ ok: false, retryAfterMs: 30_000 });
    logger.info('a');
    await logger.flush();
    tick(10_000);
    await logger.flush();
    expect(transport).toHaveBeenCalledTimes(1);
    tick(20_000);
    await logger.flush();
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('исключение в транспорте не роняет приложение', async () => {
    const { logger, transport } = setup();
    transport.mockRejectedValueOnce(new Error('offline'));
    logger.info('a');
    await expect(logger.flush()).resolves.toBeUndefined();
    expect(logger.stats().pending).toBe(1);
  });

  it('без сервера буфер ограничен: старые записи вытесняются', async () => {
    const { logger, transport } = setup({ maxBuffer: 5, batchSize: 50 });
    transport.mockResolvedValue({ ok: false });
    for (let i = 0; i < 8; i += 1) logger.info(`event ${i}`);
    await logger.flush();
    expect(logger.stats()).toMatchObject({ pending: 5, dropped: 3 });
  });

  it('без транспорта (mock-режим) записи не копятся', async () => {
    const { logger } = setup({ transport: null });
    logger.info('a');
    await logger.flush();
    expect(logger.stats().pending).toBe(0);
  });

  it('start/stop: периодическая отправка по таймеру', async () => {
    jest.useFakeTimers();
    try {
      const { logger, transport } = setup();
      logger.start();
      logger.info('tick');
      expect(transport).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(5_000);
      expect(transport).toHaveBeenCalledTimes(1);
      logger.stop();
      logger.info('after stop');
      await jest.advanceTimersByTimeAsync(10_000);
      expect(transport).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
