import { useCallback, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';
import { Touchable } from './Pressable';
import { Text } from './Text';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
};

/**
 * Glass segmented control with an animated raised pill
 * (Top gainers / Top losers).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const [trackWidth, setTrackWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentWidth = trackWidth > 0 ? trackWidth / options.length : 0;

  const pillStyle = useAnimatedStyle(() => {
    const target = activeIndex * segmentWidth;
    return {
      width: segmentWidth,
      transform: [
        { translateX: reduceMotion ? target : withSpring(target, theme.springs.pill) },
      ],
    };
  }, [activeIndex, reduceMotion, segmentWidth, theme.springs.pill]);

  const handleLayout = useCallback((width: number) => {
    setTrackWidth(width);
  }, []);

  return (
    <Glass
      variant="clear"
      radius={theme.radii.pill}
      elevated={false}
      style={[{ height: theme.sizes.segmentHeight }, style]}
      onLayout={(event) => handleLayout(event.nativeEvent.layout.width - 8)}
    >
      <View style={[styles.track, { padding: 4 }]}>
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.glassSelected,
              },
              theme.shadows.soft,
              pillStyle,
            ]}
          />
        ) : null}

        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Touchable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              pressedScale={1}
              style={styles.segment}
            >
              <Text variant="bodyStrong" color={selected ? 'textPrimary' : 'textMuted'}>
                {option.label}
              </Text>
            </Touchable>
          );
        })}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
