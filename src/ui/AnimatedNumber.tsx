import { useEffect } from 'react';
import { type StyleProp, StyleSheet, type TextStyle, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { type ThemeColors, type TypographyToken, useTheme } from '@/theme';

import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';
import { Text } from './Text';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export type AnimatedNumberProps = {
  /** уже отформатированная строка: `12 480`, `0.0412`, `+2.4%` */
  value: string;
  variant?: TypographyToken;
  color?: keyof ThemeColors;
  style?: StyleProp<TextStyle>;
  /** стиль контейнера (отступы, сдвиг базовой линии) */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * число, у которого цифры перекатываются как на табло. каждая цифра — колонка
 * 0–9, сдвигаемая пружиной; разделители и знаки остаются статичными.
 * разряды привязаны к правому краю, поэтому при смене длины числа единицы
 * не «прыгают» в соседнюю колонку.
 */
export function AnimatedNumber({
  value,
  variant = 'body',
  color = 'textPrimary',
  style,
  containerStyle,
}: AnimatedNumberProps) {
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const typography = theme.typography[variant];
  const lineHeight = typography.lineHeight ?? (typography.fontSize ?? 14) * 1.2;
  const chars = value.split('');

  return (
    <View style={[styles.row, containerStyle]} accessible accessibilityLabel={value}>
      {chars.map((char, index) => {
        const position = chars.length - index;
        if (/\d/.test(char)) {
          return (
            <DigitColumn
              key={`digit-${position}`}
              digit={Number(char)}
              lineHeight={lineHeight}
              variant={variant}
              color={color}
              style={style}
              reduceMotion={reduceMotion}
            />
          );
        }
        return (
          <Text
            key={`char-${position}-${char}`}
            variant={variant}
            color={color}
            style={[styles.tabular, { height: lineHeight }, style]}
          >
            {char}
          </Text>
        );
      })}
    </View>
  );
}

type DigitColumnProps = {
  digit: number;
  lineHeight: number;
  variant: TypographyToken;
  color: keyof ThemeColors;
  style?: StyleProp<TextStyle>;
  reduceMotion: boolean;
};

function DigitColumn({ digit, lineHeight, variant, color, style, reduceMotion }: DigitColumnProps) {
  const theme = useTheme();
  // при первом появлении цифры прокручиваются от нуля — экран «оживает»
  const offset = useSharedValue(reduceMotion ? -digit * lineHeight : 0);

  useEffect(() => {
    const target = -digit * lineHeight;
    offset.value = reduceMotion ? target : withSpring(target, theme.springs.roll);
  }, [digit, lineHeight, offset, reduceMotion, theme.springs.roll]);

  const columnStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <View style={{ height: lineHeight, overflow: 'hidden' }}>
      <Animated.View style={columnStyle}>
        {DIGITS.map((item) => (
          <Text
            key={item}
            variant={variant}
            color={color}
            style={[styles.tabular, { height: lineHeight }, style]}
          >
            {item}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
