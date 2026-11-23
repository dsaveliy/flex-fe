import { AppState, Platform } from 'react-native';

import type { RootLogger } from './logger';

type ErrorUtilsShape = {
  getGlobalHandler(): (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: unknown, isFatal?: boolean) => void): void;
};

/**
 * ловит то, что не поймали экраны: необработанные исключения JS (native — ErrorUtils,
 * web — window.onerror) и отклонённые промисы. при уходе в фон или закрытии вкладки
 * буфер отправляется сразу. возвращает функцию снятия обработчиков
 */
export function installGlobalHandlers(logger: RootLogger): () => void {
  const log = logger.child('app');
  const cleanups: (() => void)[] = [];

  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  if (errorUtils) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      log.error(isFatal ? 'fatal JS error' : 'uncaught JS error', error, { fatal: Boolean(isFatal) });
      void logger.flush();
      previous(error, isFatal);
    });
    cleanups.push(() => errorUtils.setGlobalHandler(previous));
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const onError = (event: ErrorEvent) =>
      log.error('window error', event.error ?? event.message, {
        file: event.filename,
        line: event.lineno,
      });
    const onRejection = (event: PromiseRejectionEvent) =>
      log.error('unhandled promise rejection', event.reason);
    const onHide = () => void logger.flush();
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('pagehide', onHide);
    cleanups.push(() => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('pagehide', onHide);
    });
  }

  const subscription = AppState.addEventListener('change', (state) => {
    log.debug('app state', { state });
    if (state !== 'active') void logger.flush();
  });
  cleanups.push(() => subscription.remove());

  logger.start();
  cleanups.push(() => logger.stop());

  return () => cleanups.forEach((cleanup) => cleanup());
}
