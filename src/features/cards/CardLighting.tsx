import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { palette } from '@/theme';

import { WHITE_TRANSPARENT } from './cardStyles';

/**
 * положение «света» относительно карты, обе оси в диапазоне примерно -1..1.
 * складывается из наклона телефона (у активной карты) и сдвига при свайпе,
 * поэтому блики и переливание бегут по пластику, как у карт в Wallet.
 */
export type CardLight = { x: SharedValue<number>; y: SharedValue<number> };

type SurfaceProps = { width: number; height: number };

/**
 * гильош — тонкие защитные волны, как на банкнотах и премиальных картах.
 * статичный слой, дающий пластику фактуру.
 */
export function CardGuilloche({ width, height, ink }: SurfaceProps & { ink: string }) {
  const paths = useMemo(() => {
    const lines: string[] = [];
    const count = 11;
    const steps = 48;
    for (let k = 0; k < count; k++) {
      const base = height * (0.08 + (k / (count - 1)) * 0.84);
      const amplitude = height * (0.035 + 0.02 * Math.sin(k));
      const phase = k * 0.55;
      const points: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const y = base + Math.sin((i / steps) * Math.PI * 3.2 + phase) * amplitude;
        points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      lines.push(points.join(' '));
    }
    return lines;
  }, [width, height]);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {paths.map((d, index) => (
        <Path key={index} d={d} stroke={ink} strokeOpacity={0.07} strokeWidth={0.6} fill="none" />
      ))}
    </Svg>
  );
}

/**
 * голографическая полоса: радужный градиент поверх пластика в режиме
 * наложения. едет за светом и разгорается, когда карту наклоняют.
 */
export function CardHolo({
  width,
  light,
  onDark,
}: SurfaceProps & { light: CardLight; onDark: boolean }) {
  const style = useAnimatedStyle(() => {
    const strength = Math.min(1, Math.abs(light.x.value) + Math.abs(light.y.value) * 0.6);
    return {
      opacity: (onDark ? 0.16 : 0.3) + strength * (onDark ? 0.24 : 0.4),
      transform: [{ translateX: light.x.value * width * 0.45 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.holo, { mixBlendMode: onDark ? 'screen' : 'overlay' }, style]}
    >
      <LinearGradient
        colors={[
          WHITE_TRANSPARENT,
          palette.holoPink,
          palette.holoYellow,
          palette.holoCyan,
          palette.holoViolet,
          WHITE_TRANSPARENT,
        ]}
        locations={[0.2, 0.36, 0.45, 0.54, 0.63, 0.8]}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** блик глянцевого пластика: широкое мягкое пятно отражённого света, бегущее за светом */
export function CardGlare({
  width,
  height,
  light,
  id,
}: SurfaceProps & { light: CardLight; id: string }) {
  const spotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -light.x.value * width * 0.45 },
      { translateY: -light.y.value * height * 0.4 },
    ],
  }));
  const spotId = `glare-${id}`;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spot,
        { width: width * 1.3, height: height * 1.3, left: -width * 0.2, top: -height * 0.45 },
        spotStyle,
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={spotId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={palette.white} stopOpacity={0.42} />
            <Stop offset="0.45" stopColor={palette.white} stopOpacity={0.12} />
            <Stop offset="1" stopColor={palette.white} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={`url(#${spotId})`} />
      </Svg>
    </Animated.View>
  );
}

/** фаска по краю: светлая кромка сверху слева, почти невидимая снизу справа */
export function CardBevel({
  width,
  height,
  radius,
  id,
}: SurfaceProps & { radius: number; id: string }) {
  const gradientId = `bevel-${id}`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.white} stopOpacity={0.85} />
          <Stop offset="0.45" stopColor={palette.white} stopOpacity={0.2} />
          <Stop offset="1" stopColor={palette.white} stopOpacity={0.06} />
        </SvgLinearGradient>
      </Defs>
      <Rect
        x={0.6}
        y={0.6}
        width={width - 1.2}
        height={height - 1.2}
        rx={radius}
        ry={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={1.2}
      />
    </Svg>
  );
}

/** золотой EMV-чип с контактными площадками */
export function EmvChip({ unit, id }: { unit: number; id: string }) {
  const width = 40 * unit;
  const height = 30 * unit;
  const gradientId = `chip-${id}`;
  const line = { stroke: palette.chipDark, strokeOpacity: 0.65, strokeWidth: 0.9, fill: 'none' };

  return (
    <Svg width={width} height={height} viewBox="0 0 40 30">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.chipLight} />
          <Stop offset="0.5" stopColor={palette.chipMid} />
          <Stop offset="1" stopColor={palette.chipDark} />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0.5} y={0.5} width={39} height={29} rx={5.5} fill={`url(#${gradientId})`} />
      <Rect x={0.5} y={0.5} width={39} height={29} rx={5.5} {...line} />
      {/* контактные площадки: три ряда слева и справа, центральная площадка */}
      <Path d="M0.5 10H13M0.5 20H13M27 10H39.5M27 20H39.5" {...line} />
      <Rect x={13} y={6} width={14} height={18} rx={3} {...line} />
      <Path d="M20 0.5V6M20 24V29.5" {...line} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  holo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '-50%',
    width: '200%',
  },
  spot: {
    position: 'absolute',
  },
});
