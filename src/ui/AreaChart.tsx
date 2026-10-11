import { useId, useMemo } from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';
import { smoothPath, toPoints } from '@/utils/chartPath';

export type AreaChartProps = {
  data: number[];
  width: number;
  height: number;
  /** цвет тренда; `auto` определяет его по первому и последнему значениям */
  tone?: 'positive' | 'negative' | 'auto';
  strokeWidth?: number;
};

/** статичный сглаженный график с градиентной заливкой — для виджетов и разделов Crypto */
export function AreaChart({
  data,
  width,
  height,
  tone = 'auto',
  strokeWidth = 2,
}: AreaChartProps) {
  const theme = useTheme();
  const gradientId = `area-${useId().replace(/:/g, '')}`;

  const line = useMemo(
    () => smoothPath(toPoints(data, width, height, strokeWidth + 2)),
    [data, height, strokeWidth, width],
  );
  const area = line ? `${line} L${width} ${height} L0 ${height} Z` : '';

  const resolvedTone =
    tone === 'auto' ? ((data.at(-1) ?? 0) >= (data[0] ?? 0) ? 'positive' : 'negative') : tone;
  const color = resolvedTone === 'positive' ? theme.colors.positive : theme.colors.negative;

  return (
    <Svg width={width} height={height} accessibilityElementsHidden>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.28} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${gradientId})`} />
      <Path
        d={line}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
