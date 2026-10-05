import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export type AccessibilityFlags = {
  reduceTransparency: boolean;
  reduceMotion: boolean;
};

type Subscription = { remove: () => void };

/**
 * не каждая платформа реализует каждый API AccessibilityInfo
 * (например, `isReduceTransparencyEnabled` есть только на iOS и отсутствует на web/Android).
 * всегда проверяйте наличие API и не позволяйте отсутствующему API уронить дерево.
 */
async function safeQuery(method: 'isReduceTransparencyEnabled' | 'isReduceMotionEnabled') {
  const fn = (AccessibilityInfo as unknown as Record<string, unknown>)[method];
  if (typeof fn !== 'function') return false;
  try {
    return Boolean(await (fn as () => Promise<boolean>).call(AccessibilityInfo));
  } catch {
    return false;
  }
}

function safeSubscribe(
  event: 'reduceTransparencyChanged' | 'reduceMotionChanged',
  handler: (enabled: boolean) => void,
): Subscription | null {
  try {
    const sub = (
      AccessibilityInfo as unknown as {
        addEventListener: (name: string, cb: (value: boolean) => void) => Subscription | undefined;
      }
    ).addEventListener(event, handler);
    return sub && typeof sub.remove === 'function' ? sub : null;
  } catch {
    return null;
  }
}

/** запасной вариант для web: CSS media queries отдают те же настройки уровня ОС */
function queryMedia(query: string): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

/**
 * актуальные настройки доступности. стеклянные поверхности должны
 * деградировать до непрозрачной заливки при включённом "Reduce Transparency",
 * а анимации — пропускаться при включённом "Reduce Motion".
 */
export function useAccessibilityFlags(): AccessibilityFlags {
  const [flags, setFlags] = useState<AccessibilityFlags>({
    reduceTransparency: false,
    reduceMotion: false,
  });

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      safeQuery('isReduceTransparencyEnabled'),
      safeQuery('isReduceMotionEnabled'),
    ]).then(([reduceTransparency, reduceMotion]) => {
      if (cancelled) return;
      setFlags({
        reduceTransparency:
          reduceTransparency || queryMedia('(prefers-reduced-transparency: reduce)'),
        reduceMotion: reduceMotion || queryMedia('(prefers-reduced-motion: reduce)'),
      });
    });

    const transparencySub = safeSubscribe('reduceTransparencyChanged', (reduceTransparency) => {
      setFlags((prev) => ({ ...prev, reduceTransparency }));
    });
    const motionSub = safeSubscribe('reduceMotionChanged', (reduceMotion) => {
      setFlags((prev) => ({ ...prev, reduceMotion }));
    });

    return () => {
      cancelled = true;
      transparencySub?.remove();
      motionSub?.remove();
    };
  }, []);

  return flags;
}
