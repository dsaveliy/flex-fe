import { useSyncExternalStore } from 'react';

/** меньше этого — нижняя панель Safari, а не клавиатура (её учитывает useBrowserBarInset) */
const KEYBOARD_MIN = 120;

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  const update = () => {
    // Safari прокручивает страницу к полю ввода, хотя приложение и так поднимает его над клавиатурой:
    // возвращаем страницу на место, иначе шапка уезжает за верх экрана
    if (window.scrollY !== 0) window.scrollTo(0, 0);
    onChange();
  };
  viewport?.addEventListener('resize', update);
  viewport?.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  return () => {
    viewport?.removeEventListener('resize', update);
    viewport?.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  };
}

/** расстояние от низа приложения (#root) до низа видимой области, если его закрывает клавиатура */
function covered() {
  const root = document.getElementById('root');
  const viewport = window.visualViewport;
  if (!root || !viewport) return 0;
  const hidden = Math.round(
    root.getBoundingClientRect().bottom - (viewport.offsetTop + viewport.height),
  );
  return hidden > KEYBOARD_MIN ? hidden : 0;
}

/**
 * браузер на телефоне не сжимает страницу под клавиатуру (Safari только сдвигает видимую
 * область), и KeyboardAvoidingView в react-native-web ничего не делает. экраны с полем ввода
 * внизу поднимают его на это значение
 */
export function useKeyboardInset(): number {
  return useSyncExternalStore(subscribe, covered, () => 0);
}
