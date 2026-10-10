import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@/theme';

import { WHITE_TRANSPARENT } from './cardStyles';
import { seededRandom, useFrostProgress } from './frost';
import { buildFrostPattern, type FrostStroke } from './frostPatterns';
import { FrozenBadge } from './FrozenBadge';

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const FREEZE_MS = 1900;
const MELT_MS = 1300;
/** на какую долю ширины/высоты иней доползает от каждого края */
const RIM_REACH = 0.42;

export type FrostOverlayProps = {
  /** внутренний отступ пластика */
  inset: number;
  /** id карты — от него зависит узор */
  seed: string;
  /** целевое состояние: true — намерзает, false — тает */
  frozen: boolean;
  /** карта уже была заморожена при открытии экрана — показать сразу, без намерзания */
  skipIntro: boolean;
  /** лёд полностью растаял — оверлей можно размонтировать */
  onMelted: () => void;
  width: number;
  height: number;
  /** карта сейчас в центре карусели (для постоянных эффектов) */
  active: boolean;
};

/**
 * лёд замороженной карты сходится со всех сторон: от каждого края к центру
 * наползает иней, снежинки у краёв зарождаются первыми, в центре — последними;
 * карта мутнеет и холодеет, на кончиках лучей мерцают искорки. при разморозке
 * узор втягивается обратно к краям и по карте стекают капли.
 */
export function FrostOverlay({
  inset,
  seed,
  frozen,
  skipIntro,
  onMelted,
  width,
  height,
  active,
}: FrostOverlayProps) {
  const focused = useIsFocused();
  const { progress, reduceMotion } = useFrostProgress({
    frozen,
    skipIntro,
    onMelted,
    freezeMs: FREEZE_MS,
    meltMs: MELT_MS,
  });

  const pattern = useMemo(() => buildFrostPattern(seed, width, height), [seed, width, height]);
  const sparkles = useMemo(() => {
    const rand = seededRandom(`${seed}-sparkles`);
    return Array.from({ length: 7 }, (_, index) => {
      const tip = pattern.tips[Math.floor(rand() * pattern.tips.length)];
      return { ...tip, size: 5 + rand() * 4, delay: index * 260 + rand() * 300 };
    });
  }, [pattern, seed]);
  const drops = useMemo(() => {
    const rand = seededRandom(`${seed}-drops`);
    return Array.from({ length: 5 }, () => ({
      x: width * (0.1 + rand() * 0.8),
      y: height * rand() * 0.35,
      fall: height * (0.4 + rand() * 0.3),
      delay: rand() * 0.3,
    }));
  }, [seed, width, height]);

  // капли — только при таянии
  const melt = useSharedValue(0);
  useEffect(() => {
    melt.value = 0;
    if (frozen || reduceMotion) return;
    melt.value = withTiming(1, { duration: MELT_MS, easing: Easing.in(Easing.quad) });
  }, [frozen, melt, reduceMotion]);

  // карта мутнеет вслед за инеем, к концу намерзания — полностью
  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(progress.value, [0.1, 1], [0, 18], 'clamp'),
  }));
  const tintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.1, 1], [0, 0.28], 'clamp'),
  }));
  // полосы инея растут от каждого края внутрь — лёд сходится к центру
  const reach = (size: number) => {
    'worklet';
    return interpolate(progress.value, [0, 0.85], [0, size * RIM_REACH], 'clamp');
  };
  const rimOpacity = () => {
    'worklet';
    return interpolate(progress.value, [0, 0.25], [0, 0.6], 'clamp');
  };
  const topStyle = useAnimatedStyle(() => ({ height: reach(height), opacity: rimOpacity() }));
  const bottomStyle = useAnimatedStyle(() => ({ height: reach(height), opacity: rimOpacity() }));
  const leftStyle = useAnimatedStyle(() => ({ width: reach(width), opacity: rimOpacity() * 0.8 }));
  const rightStyle = useAnimatedStyle(() => ({ width: reach(width), opacity: rimOpacity() * 0.8 }));

  const live = frozen && active && focused && !reduceMotion;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <AnimatedBlur tint="light" animatedProps={blurProps} style={StyleSheet.absoluteFill} />
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: palette.ice }, tintStyle]}
      />
      {/* иней гуще у краёв, как на замёрзшем стекле, и наползает к центру */}
      <Animated.View style={[styles.top, topStyle]}>
        <LinearGradient
          colors={[palette.white, WHITE_TRANSPARENT]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.bottom, bottomStyle]}>
        <LinearGradient
          colors={[WHITE_TRANSPARENT, palette.white]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.left, leftStyle]}>
        <LinearGradient
          colors={[palette.white, WHITE_TRANSPARENT]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.right, rightStyle]}>
        <LinearGradient
          colors={[WHITE_TRANSPARENT, palette.white]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {pattern.strokes.map((stroke, index) => (
          <FrostStrokePath key={index} stroke={stroke} progress={progress} />
        ))}
      </Svg>

      {sparkles.map((sparkle, index) => (
        <Sparkle key={index} {...sparkle} live={live} progress={progress} />
      ))}

      {drops.map((drop, index) => (
        <Drop key={index} {...drop} melt={melt} />
      ))}

      <FrozenBadge progress={progress} inset={inset} />
    </View>
  );
}

function FrostStrokePath({
  stroke,
  progress,
}: {
  stroke: FrostStroke;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const local = Math.min(1, Math.max(0, (progress.value - stroke.start) / stroke.span));
    return { strokeDashoffset: stroke.length * (1 - local) };
  });

  return (
    <AnimatedPath
      d={stroke.d}
      stroke={palette.white}
      strokeWidth={stroke.width}
      strokeOpacity={stroke.opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={[stroke.length, stroke.length]}
      animatedProps={animatedProps}
    />
  );
}

type SparkleProps = {
  x: number;
  y: number;
  size: number;
  delay: number;
  /** мерцать (карта заморожена, в фокусе, без Reduce Motion) */
  live: boolean;
  progress: SharedValue<number>;
};

/** четырёхлучевая искорка на кончике кристалла */
function Sparkle({ x, y, size, delay, live, progress }: SparkleProps) {
  const twinkle = useSharedValue(0);

  useEffect(() => {
    if (!live) {
      cancelAnimation(twinkle);
      twinkle.value = withTiming(0, { duration: 200 });
      return;
    }
    twinkle.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
          withTiming(0.1, { duration: 900, easing: Easing.in(Easing.quad) }),
          withTiming(0.1, { duration: 700 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(twinkle);
  }, [delay, live, twinkle]);

  const style = useAnimatedStyle(() => ({
    opacity: twinkle.value * progress.value * progress.value,
    transform: [{ scale: 0.5 + twinkle.value * 0.6 }, { rotate: `${twinkle.value * 45}deg` }],
  }));

  const s = size;
  const k = s * 0.22;
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x - s, top: y - s, width: s * 2, height: s * 2 },
        style,
      ]}
    >
      <Svg width={s * 2} height={s * 2} viewBox={`${-s} ${-s} ${s * 2} ${s * 2}`}>
        <Path
          d={`M0 ${-s} L${k} ${-k} L${s} 0 L${k} ${k} L0 ${s} L${-k} ${k} L${-s} 0 L${-k} ${-k} Z`}
          fill={palette.white}
        />
      </Svg>
    </Animated.View>
  );
}

type DropProps = { x: number; y: number; fall: number; delay: number; melt: SharedValue<number> };

/** капля талой воды: появляется и стекает вниз при разморозке */
function Drop({ x, y, fall, delay, melt }: DropProps) {
  const style = useAnimatedStyle(() => {
    const local = Math.min(1, Math.max(0, (melt.value - delay) / (1 - delay)));
    return {
      opacity: Math.sin(local * Math.PI) * 0.9,
      transform: [{ translateY: local * fall }, { scaleY: 1 + local * 0.6 }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: 5,
          height: 8,
          borderRadius: 3,
          backgroundColor: palette.ice,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.white,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  left: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  right: { position: 'absolute', top: 0, bottom: 0, right: 0 },
});
