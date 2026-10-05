import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Glass, GlassGroup } from './Glass';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';
import { Icon, type IconName } from './icons/Icon';
import { Touchable } from './Pressable';
import { Text } from './Text';

/** соответствие имени маршрута и иконки; держать в синхронизации с `app/(tabs)` */
const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  crypto: 'crypto',
  cards: 'cards',
  account: 'account',
};

/**
 * плавающий стеклянный таб-бар в форме капсулы с анимированной мятной
 * «таблеткой» за активной вкладкой. контент прокручивается под ним, поэтому
 * стекло преломляет его.
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useAccessibilityFlags();
  const [trackWidth, setTrackWidth] = useState(0);

  const tabCount = state.routes.length;
  const tabWidth = trackWidth > 0 ? trackWidth / tabCount : 0;

  const pillStyle = useAnimatedStyle(() => {
    const target = state.index * tabWidth;
    return {
      width: tabWidth,
      transform: [
        { translateX: reduceMotion ? target : withSpring(target, theme.springs.pill) },
      ],
    };
  }, [reduceMotion, state.index, tabWidth, theme.springs.pill]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingHorizontal: theme.sizes.tabBarInset,
          paddingBottom: Math.max(insets.bottom, theme.spacing.md),
        },
      ]}
    >
      <GlassGroup spacing={theme.spacing.sm}>
        <Glass
          variant="regular"
          interactive
          radius={theme.radii.pill}
          style={{ height: theme.sizes.tabBarHeight }}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width - 12)}
        >
          <View style={[styles.track, { padding: 6 }]}>
            {tabWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.pill,
                  { borderRadius: theme.radii.pill, backgroundColor: theme.colors.accentMuted },
                  pillStyle,
                ]}
              />
            ) : null}

            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const focused = state.index === index;
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : (options.title ?? route.name);

              return (
                <Touchable
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  pressedScale={0.94}
                  style={styles.tab}
                  onPress={() => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }}
                >
                  <Icon
                    name={TAB_ICONS[route.name] ?? 'home'}
                    size={20}
                    color={focused ? theme.colors.accent : theme.colors.textInactive}
                  />
                  <Text
                    variant="micro"
                    color={focused ? 'accent' : 'textInactive'}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        </Glass>
      </GlassGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  pill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
