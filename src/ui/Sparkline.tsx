import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme';

export type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  /** цвет тренда; `auto` определяет его по первому и последнему значениям */
  tone?: 'positive' | 'negative' | 'auto';
  strokeWidth?: number;
};

function buildPath(data: number[], width: number, height: number, padding: number): string {
  if (data.length < 2) return '';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (data.length - 1);

  return data
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = padding + (1 - (value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

/** лёгкий SVG-sparkline для плиток цен и карточки портфеля */
export function Sparkline({
  data,
  width = 72,
  height = 28,
  tone = 'auto',
  strokeWidth = 2,
}: SparklineProps) {
  const theme = useTheme();
  const path = useMemo(() => buildPath(data, width, height, strokeWidth), [
    data,
    height,
    strokeWidth,
    width,
  ]);

  const resolvedTone =
    tone === 'auto'
      ? (data.at(-1) ?? 0) >= (data[0] ?? 0)
        ? 'positive'
        : 'negative'
      : tone;

  const color = resolvedTone === 'positive' ? theme.colors.positive : theme.colors.negative;

  return (
    <Svg width={width} height={height} accessibilityElementsHidden>
      <Path
        d={path}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
