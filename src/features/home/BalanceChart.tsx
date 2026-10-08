import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/theme';
import { useAccessibilityFlags } from '@/ui';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** вертикальные поля, чтобы линия и точка не обрезались по краям */
const PAD_Y = 12;

type Point = { x: number; y: number };

function toPoints(data: number[], width: number, height: number): Point[] {
  if (data.length < 2 || width <= 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  return data.map((value, index) => ({
    x: index * step,
    y: PAD_Y + (1 - (value - min) / range) * (height - PAD_Y * 2),
  }));
}

/** сглаженная кривая: catmull-rom, переведённый в кубические безье */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** длина ломаной — достаточно точная оценка для анимации прорисовки */
function polylineLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return length * 1.05;
}

export type BalanceChartProps = {
  data: number[];
  width: number;
  height?: number;
  /** индекс точки под пальцем или `null`, когда палец отпущен */
  onScrub: (index: number | null) => void;
};

/**
 * интерактивный график баланса: линия с градиентной заливкой прорисовывается
 * при смене периода; если провести пальцем по горизонтали, линия-курсор и
 * точка едут за ним, а на каждой новой точке срабатывает лёгкая вибрация.
 * вертикальный жест не перехватывается — экран продолжает скроллиться.
 */
export function BalanceChart({ data, width, height = 168, onScrub }: BalanceChartProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { reduceMotion } = useAccessibilityFlags();

  const points = useMemo(() => toPoints(data, width, height), [data, height, width]);
  const line = useMemo(() => smoothPath(points), [points]);
  const area = useMemo(
    () => (line ? `${line} L${width} ${height} L0 ${height} Z` : ''),
    [height, line, width],
  );
  const length = useMemo(() => polylineLength(points), [points]);

  const draw = useSharedValue(0);
  const scrubIndex = useSharedValue(-1);

  useEffect(() => {
    draw.value = 0;
    draw.value = reduceMotion ? 1 : withTiming(1, { duration: 900 });
  }, [data, draw, reduceMotion]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - draw.value),
  }));
  const areaProps = useAnimatedProps(() => ({ opacity: draw.value }));

  const pointsX = points.map((point) => point.x);
  const pointsY = points.map((point) => point.y);
  const step = points.length > 1 ? width / (points.length - 1) : 1;

  const cursorStyle = useAnimatedStyle(() => {
    const index = scrubIndex.value;
    return {
      opacity: withTiming(index >= 0 ? 1 : 0, { duration: 120 }),
      transform: [{ translateX: index >= 0 ? pointsX[index] : 0 }],
    };
  });
  const dotStyle = useAnimatedStyle(() => {
    const index = scrubIndex.value;
    return {
      opacity: withTiming(index >= 0 ? 1 : 0, { duration: 120 }),
      transform: [
        { translateX: (index >= 0 ? pointsX[index] : 0) - 7 },
        { translateY: (index >= 0 ? pointsY[index] : 0) - 7 },
      ],
    };
  });

  const emitScrub = (index: number) => {
    void Haptics.selectionAsync();
    onScrub(index);
  };
  const endScrub = () => onScrub(null);

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onUpdate((event) => {
      const next = Math.max(0, Math.min(pointsX.length - 1, Math.round(event.x / step)));
      if (next !== scrubIndex.value) {
        scrubIndex.value = next;
        scheduleOnRN(emitScrub, next);
      }
    })
    .onFinalize(() => {
      if (scrubIndex.value !== -1) {
        scrubIndex.value = -1;
        scheduleOnRN(endScrub);
      }
    });

  if (points.length < 2) return <View style={{ height }} />;

  return (
    <GestureDetector gesture={pan}>
      <View
        style={{ width, height }}
        accessible
        accessibilityLabel={t('a11y.balanceChart')}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="balance-area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.accent} stopOpacity={0.32} />
              <Stop offset="100%" stopColor={theme.colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <AnimatedPath d={area} fill="url(#balance-area)" animatedProps={areaProps} />
          <AnimatedPath
            d={line}
            stroke={theme.colors.accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={[length, length]}
            animatedProps={lineProps}
          />
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={[styles.cursor, { height, backgroundColor: theme.colors.accent }, cursorStyle]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dot,
            { backgroundColor: theme.colors.accent, borderColor: theme.colors.textInverse },
            theme.shadows.soft,
            dotStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cursor: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1.5,
    opacity: 0,
  },
  dot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    opacity: 0,
  },
});
