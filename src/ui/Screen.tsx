import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { ScreenBackdrop } from './ScreenBackdrop';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Disable for custom scroll containers. */
  scrollable?: boolean;
  /** Pull-to-refresh handler; shows a native RefreshControl. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Extra bottom padding so content clears the floating tab bar. */
  contentBottomInset?: number;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
} & Pick<ScrollViewProps, 'stickyHeaderIndices' | 'onScroll' | 'scrollEventThrottle'>;

/**
 * Page shell: mint→aqua→sky gradient plus soft colored blobs.
 * Content always scrolls OVER this backdrop so glass surfaces have something
 * rich to refract.
 */
export function Screen({
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  contentBottomInset,
  contentContainerStyle,
  style,
  ...scrollProps
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset =
    contentBottomInset ??
    insets.bottom + theme.sizes.tabBarHeight + theme.sizes.tabBarInset + theme.spacing.xxl;

  const content = scrollable ? (
    <ScrollView
      {...scrollProps}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[
        {
          paddingTop: insets.top + theme.spacing.sm,
          paddingBottom: bottomInset,
        },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            progressViewOffset={insets.top}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        { paddingTop: insets.top + theme.spacing.sm, paddingBottom: bottomInset },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.fill, style]}>
      <LinearGradient
        colors={[
          theme.colors.backgroundTop,
          theme.colors.backgroundMid,
          theme.colors.backgroundBottom,
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScreenBackdrop />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});