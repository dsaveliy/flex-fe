import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { palette } from '@/theme';
import { useAccessibilityFlags } from '@/ui';
import type { GreetingSlot } from '@/utils/format';

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export type GreetingIconProps = {
  slot: GreetingSlot;
  size?: number;
};

/**
 * значок времени суток рядом с именем: утром восход, днём солнце, вечером
 * закат, ночью месяц со звёздами. у каждого своя спокойная анимация
 * (лучи вращаются, солнце покачивается над горизонтом, звёзды мерцают);
 * при Reduce Motion значок статичен.
 */
export function GreetingIcon({ slot, size = 30 }: GreetingIconProps) {
  const { reduceMotion } = useAccessibilityFlags();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0;
      return;
    }
    progress.value =
      slot === 'afternoon'
        ? withRepeat(withTiming(1, { duration: 24_000, easing: Easing.linear }), -1)
        : withRepeat(
            withSequence(
              withTiming(1, { duration: 2_200, easing: Easing.inOut(Easing.sin) }),
              withTiming(0, { duration: 2_200, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
          );
  }, [progress, reduceMotion, slot]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));
  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (slot === 'morning' ? -1 : 1) * progress.value * size * 0.08 }],
  }));
  const twinkleStyle = useAnimatedStyle(() => ({ opacity: 0.35 + progress.value * 0.65 }));

  const box = { width: size, height: size };

  if (slot === 'afternoon') {
    return (
      <Animated.View style={[box, spinStyle]} accessibilityElementsHidden>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4.6} fill={palette.sun} />
          {RAY_ANGLES.map((angle) => (
            <Path
              key={angle}
              d="M12 2.2v2.6"
              stroke={palette.sun}
              strokeWidth={2}
              strokeLinecap="round"
              rotation={angle}
              origin="12, 12"
            />
          ))}
        </Svg>
      </Animated.View>
    );
  }

  if (slot === 'night') {
    return (
      <View style={box} accessibilityElementsHidden>
        <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
          <Path d="M17.5 15.8A7 7 0 0 1 9.2 5.1a7.5 7.5 0 1 0 8.3 10.7z" fill={palette.moon} />
        </Svg>
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, twinkleStyle]}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M18 3.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill={palette.moon} />
            <Circle cx={21} cy={10} r={0.9} fill={palette.moon} />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // утро и вечер: половина солнца над линией горизонта
  const color = slot === 'morning' ? palette.sun : palette.sunset;

  return (
    <View style={box} accessibilityElementsHidden>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, bobStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <ClipPath id={`horizon-${slot}`}>
              <Rect x={0} y={0} width={24} height={16.5} />
            </ClipPath>
          </Defs>
          <Circle cx={12} cy={16.5} r={5.2} fill={color} clipPath={`url(#horizon-${slot})`} />
          {[-60, -30, 0, 30, 60].map((angle) => (
            <Path
              key={angle}
              d="M12 5.4v2.2"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              rotation={angle}
              origin="12, 16.5"
            />
          ))}
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
        <Path d="M3 18.5h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
