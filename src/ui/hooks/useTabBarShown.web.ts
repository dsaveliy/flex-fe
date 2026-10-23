import { useSyncExternalStore } from 'react';

/** «На экран Домой» (нет панели браузера) или компьютер (колонка ширины телефона) */
const TAB_BAR_QUERY = '(display-mode: standalone), (min-width: 600px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(TAB_BAR_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isShown() {
  // Safari на iPhone сообщает о запуске с экрана «Домой» только через navigator.standalone
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || window.matchMedia(TAB_BAR_QUERY).matches;
}

/**
 * в браузере на телефоне внизу уже есть панель Safari/Chrome, и свой таб-бар над ней
 * выглядит лишним: разделы тогда переключаются из заголовка (SectionSwitch.web.tsx)
 */
export function useTabBarShown(): boolean {
  return useSyncExternalStore(subscribe, isShown, () => true);
}
