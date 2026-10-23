import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  window.visualViewport?.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    window.visualViewport?.removeEventListener('resize', onChange);
  };
}

/** насколько приложение (#root) выше видимой области: столько закрывает панель браузера */
function overlap() {
  const root = document.getElementById('root');
  return root
    ? Math.max(0, Math.round(root.getBoundingClientRect().height - window.innerHeight))
    : 0;
}

/**
 * на iPhone приложение растянуто под нижнюю панель адреса Safari (public/index.html):
 * на столько поднимается низ прокрутки и кнопки шторок, чтобы их не закрывала панель.
 * на остальных браузерах и с экрана «Домой» — 0
 */
export function useBrowserBarInset(): number {
  return useSyncExternalStore(subscribe, overlap, () => 0);
}
