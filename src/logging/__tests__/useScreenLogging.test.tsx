import { renderHook } from '@testing-library/react-native';

import { createLogger } from '../logger';
import type { LogBatch } from '../types';
import { useScreenLogging } from '../useScreenLogging';

let mockPath = '/';
jest.mock('expo-router', () => ({ usePathname: () => mockPath }));

describe('useScreenLogging', () => {
  it('пишет просмотр экрана и подставляет маршрут в следующие записи', async () => {
    const batches: LogBatch[] = [];
    const logger = createLogger({
      transport: async (batch) => {
        batches.push(batch);
        return { ok: true };
      },
      sessionId: 'session-1234',
      platform: 'web',
    });

    const hook = await renderHook(() => useScreenLogging(logger));
    mockPath = '/transfer';
    await hook.rerender(undefined);
    logger.child('operations').info('transfer completed');
    await logger.flush();

    expect(batches.flatMap((b) => b.entries).map((e) => [e.source, e.message, e.screen])).toEqual([
      ['nav', 'screen view', '/'],
      ['nav', 'screen view', '/transfer'],
      ['operations', 'transfer completed', '/transfer'],
    ]);
  });
});
