import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export type AccessibilityFlags = {
  reduceTransparency: boolean;
  reduceMotion: boolean;
};

type Subscription = { remove: () => void };

/**
 * Not every platform implements every AccessibilityInfo API
 * (e.g. `isReduceTransparencyEnabled` is iOS-only and missing on web/Android).
 * Always feature-detect and never let a missing API crash the tree.
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

/** Web fallback: CSS media queries expose the same OS-level preferences. */
function queryMedia(query: string): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

/**
 * Live accessibility preferences. Glass surfaces must degrade to opaque fills
 * when "Reduce Transparency" is on, and animations must be skipped when
 * "Reduce Motion" is on.
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
