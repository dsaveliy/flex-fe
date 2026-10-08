import { useEffect } from 'react';
import {
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

import { useAccessibilityFlags } from './useAccessibilityFlags';

const GRAVITY = 9.81;
/** отклонение (в долях g), при котором наклон достигает максимума — около 15° */
const FULL_TILT = 0.25;
/** скорость, с которой «нейтральное» положение догоняет текущее (за кадр) */
const BASELINE_FOLLOW = 0.02;

export type TiltOptions = {
  /** максимальный поворот виджета в градусах */
  maxDeg?: number;
  /** максимальный сдвиг для параллакса в pt */
  maxShift?: number;
  /** выключать, когда экран не виден, чтобы не тратить батарею */
  enabled?: boolean;
};

/**
 * лёгкий параллакс от гироскопа на сенсоре гравитации reanimated (без
 * expo-sensors и пересборки). считается отклонение от медленно плывущего
 * «нейтрального» положения, поэтому как бы ни держали телефон, в покое
 * виджет возвращается в центр, а реагирует только на движение.
 * на web, при Reduce Motion и при `enabled: false` эффект выключен.
 */
export function useTilt({ maxDeg = 4, maxShift = 12, enabled = true }: TiltOptions = {}) {
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  const baseX = useSharedValue(0);
  const baseZ = useSharedValue(0);
  const initialized = useSharedValue(false);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  const frame = useFrameCallback(() => {
    if (!sensor.isAvailable) return;
    const x = sensor.sensor.value.x / GRAVITY;
    const z = sensor.sensor.value.z / GRAVITY;

    if (!initialized.value) {
      baseX.value = x;
      baseZ.value = z;
      initialized.value = true;
    }
    baseX.value += (x - baseX.value) * BASELINE_FOLLOW;
    baseZ.value += (z - baseZ.value) * BASELINE_FOLLOW;

    tiltX.value = Math.max(-1, Math.min(1, (x - baseX.value) / FULL_TILT));
    tiltY.value = Math.max(-1, Math.min(1, (z - baseZ.value) / FULL_TILT));
  }, false);

  useEffect(() => {
    const active = enabled && !reduceMotion && sensor.isAvailable;
    frame.setActive(active);
    if (!active) {
      tiltX.value = 0;
      tiltY.value = 0;
      // после паузы «нейтраль» берётся заново, чтобы не было рывка
      initialized.value = false;
    }
  }, [enabled, frame, initialized, reduceMotion, sensor.isAvailable, tiltX, tiltY]);

  /** поворот виджета «к пользователю» */
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${withSpring(tiltX.value * maxDeg, theme.springs.tilt)}deg` },
      { rotateX: `${withSpring(-tiltY.value * maxDeg, theme.springs.tilt)}deg` },
    ],
  }));

  /** сдвиг в обратную сторону — для фона и глубоких слоёв */
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(-tiltX.value * maxShift, theme.springs.tilt) },
      { translateY: withSpring(tiltY.value * maxShift, theme.springs.tilt) },
    ],
  }));

  return { tiltStyle, parallaxStyle, tiltX, tiltY };
}
