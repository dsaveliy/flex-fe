import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useFearGreed } from '@/api';
import { palette, useTheme } from '@/theme';
import { Text } from '@/ui';

import type { WidgetRenderProps } from './types';
import { WidgetCard } from './WidgetCard';

const STROKE = 9;

/** индекс страха и жадности: полукруглая шкала от красного к зелёному и значение */
export function FearGreedWidget({ width, height }: WidgetRenderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const index = useFearGreed();
  const gradientId = `fg-${useId().replace(/:/g, '')}`;

  const gaugeWidth = width - theme.spacing.lg * 2;
  const radius = gaugeWidth / 2 - STROKE / 2 - 2;
  const cx = gaugeWidth / 2;
  const cy = radius + STROKE / 2 + 2;
  const data = index.data;
  const angle = Math.PI * (1 - (data?.value ?? 0) / 100);
  const marker = { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
  const change = data ? data.value - data.previousValue : 0;

  return (
    <WidgetCard
      width={width}
      height={height}
      icon="gauge"
      title={t('crypto.widgets.fearGreed.short')}
      state={data ? 'ready' : index.isError ? 'error' : 'loading'}
      onRetry={() => index.refetch()}
    >
      {data ? (
        <View
          style={styles.fill}
          accessible
          accessibilityLabel={t('crypto.widgets.fearGreed.a11y', {
            value: data.value,
            level: t(`crypto.fearGreed.${data.level}`),
          })}
        >
          <Svg width={gaugeWidth} height={cy + STROKE / 2}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={theme.colors.negative} />
                <Stop offset="0.5" stopColor={palette.coinD} />
                <Stop offset="1" stopColor={theme.colors.positive} />
              </LinearGradient>
            </Defs>
            <Path
              d={`M${cx - radius} ${cy} A${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
            />
            <Circle
              cx={marker.x}
              cy={marker.y}
              r={STROKE / 2 + 2}
              fill={palette.white}
              stroke={theme.colors.textPrimary}
              strokeWidth={2}
            />
          </Svg>
          {/* число встаёт в чашу шкалы */}
          <View style={[styles.center, { marginTop: -radius * 0.55 }]}>
            <Text variant="title">{data.value}</Text>
            <Text variant="caption" numberOfLines={1}>
              {t(`crypto.fearGreed.${data.level}`)}
            </Text>
          </View>
          <Text
            variant="micro"
            color={change >= 0 ? 'positive' : 'negative'}
            align="center"
            style={styles.bottom}
          >
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)} {t('crypto.widgets.fearGreed.sinceYesterday')}
          </Text>
        </View>
      ) : null}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
  },
  bottom: {
    marginTop: 'auto',
  },
});
