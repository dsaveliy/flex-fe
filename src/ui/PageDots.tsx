import { View } from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

const DOT = 6;
const DOT_ACTIVE = 18;

export type PageDotsProps = {
  count: number;
  /** дробный индекс карусели */
  progress: SharedValue<number>;
};

/** точки-пагинация: активная вытягивается в акцентную капсулу и плавно перетекает при свайпе */
export function PageDots({ count, progress }: PageDotsProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xs + 2 }}
    >
      {Array.from({ length: count }, (_, index) => (
        <Dot key={index} index={index} progress={progress} />
      ))}
    </View>
  );
}

function Dot({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const theme = useTheme();
  const muted = theme.colors.textInactive;
  const accent = theme.colors.accent;

  const style = useAnimatedStyle(() => {
    const closeness = 1 - Math.min(1, Math.abs(progress.value - index));
    return {
      width: DOT + (DOT_ACTIVE - DOT) * closeness,
      backgroundColor: interpolateColor(closeness, [0, 1], [muted, accent]),
      opacity: 0.5 + closeness * 0.5,
    };
  });

  return <Animated.View style={[{ height: DOT, borderRadius: DOT / 2 }, style]} />;
}
