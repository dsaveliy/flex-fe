import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { ChatMember } from '@/api';
import { useTheme } from '@/theme';
import { Text, useAccessibilityFlags } from '@/ui';

const DOT = 6;

function Dot({ index, animate }: { index: number; animate: boolean }) {
  const theme = useTheme();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(lift);
      lift.value = 0;
      return;
    }
    lift.value = withDelay(
      index * 140,
      withRepeat(
        withSequence(withTiming(1, { duration: 280 }), withTiming(0, { duration: 280 })),
        -1,
      ),
    );
    return () => cancelAnimation(lift);
  }, [animate, index, lift]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + lift.value * 0.6,
    transform: [{ translateY: -lift.value * 3 }],
  }));

  return (
    <Animated.View
      style={[
        { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: theme.colors.textMuted },
        style,
      ]}
    />
  );
}

/** «Анна печатает…» над полем ввода; точки замирают при Reduce Motion и вне фокуса */
export function TypingIndicator({ users }: { users: ChatMember[] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const focused = useIsFocused();
  const { reduceMotion } = useAccessibilityFlags();

  if (users.length === 0) return null;

  const label =
    users.length === 1
      ? t('chat.typingOne', { name: users[0].name })
      : users.length === 2
        ? t('chat.typingTwo', { first: users[0].name, second: users[1].name })
        : t('chat.typingMany');

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.row,
        { gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xs },
      ]}
    >
      <View style={[styles.row, { gap: 3 }]}>
        {[0, 1, 2].map((index) => (
          <Dot key={index} index={index} animate={focused && !reduceMotion} />
        ))}
      </View>
      <Text variant="caption" color="textMuted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
