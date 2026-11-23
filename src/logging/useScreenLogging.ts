import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import type { RootLogger } from './logger';

/** каждая смена маршрута — запись `screen view`, а маршрут подставляется во все следующие записи */
export function useScreenLogging(logger: RootLogger): void {
  const pathname = usePathname();
  useEffect(() => {
    logger.setScreen(pathname);
    logger.child('nav').info('screen view', { screen: pathname });
  }, [logger, pathname]);
}
