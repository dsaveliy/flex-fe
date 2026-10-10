import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useAccessibilityFlags } from '@/ui';

/**
 * прогресс льда 0 → 1 (намерзание) и обратно (таяние). держится на shared
 * value, а не на mount/unmount, чтобы таяние тоже было анимацией.
 */
export function useFrostProgress({
  frozen,
  skipIntro,
  onMelted,
  freezeMs,
  meltMs,
}: {
  /** целевое состояние: true — намерзает, false — тает */
  frozen: boolean;
  /** показать лёд сразу, без намерзания */
  skipIntro: boolean;
  /** лёд полностью растаял */
  onMelted: () => void;
  freezeMs: number;
  meltMs: number;
}) {
  const { reduceMotion } = useAccessibilityFlags();
  const progress = useSharedValue(skipIntro || reduceMotion ? 1 : 0);

  useEffect(() => {
    if (frozen) {
      progress.value = reduceMotion
        ? 1
        : withTiming(1, { duration: freezeMs, easing: Easing.out(Easing.cubic) });
      return;
    }
    if (reduceMotion) {
      progress.value = 0;
      onMelted();
      return;
    }
    progress.value = withTiming(
      0,
      { duration: meltMs, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) scheduleOnRN(onMelted);
      },
    );
  }, [frozen, freezeMs, meltMs, onMelted, progress, reduceMotion]);

  return { progress, reduceMotion };
}

/** «хруст льда» при заморозке — серия коротких толчков; при разморозке — один мягкий */
export function playFreezeHaptics(freezing: boolean) {
  if (!freezing) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    return;
  }
  const steps = [
    Haptics.ImpactFeedbackStyle.Rigid,
    Haptics.ImpactFeedbackStyle.Light,
    Haptics.ImpactFeedbackStyle.Light,
    Haptics.ImpactFeedbackStyle.Soft,
  ];
  steps.forEach((style, step) => {
    setTimeout(() => void Haptics.impactAsync(style), step * 70);
  });
}

/** детерминированный генератор случайных чисел — узор одной карты всегда одинаковый */
export function seededRandom(seed: string) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) state = (state * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
