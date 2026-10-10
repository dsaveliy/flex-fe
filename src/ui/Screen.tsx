import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Platform,
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
  /** оборачивает контент в ScrollView. отключите для собственных контейнеров прокрутки */
  scrollable?: boolean;
  /** обработчик pull-to-refresh; показывает нативный RefreshControl */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** нижний отступ контента; по умолчанию учитывает таб-бар текущей платформы */
  contentBottomInset?: number;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
} & Pick<
  ScrollViewProps,
  'stickyHeaderIndices' | 'onScroll' | 'scrollEventThrottle' | 'onScrollBeginDrag'
>;

/**
 * оболочка страницы: градиент мята → аква → небо и мягкие цветные пятна.
 * контент всегда прокручивается НАД этим фоном, чтобы у стеклянных
 * поверхностей было что преломлять.
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

  /**
   * на web таб-бар свой и плавающий — отступы считаем вручную. на iOS
   * системный `UITabBar` сам выставляет инсеты ScrollView (статус-бар сверху,
   * бар снизу), это же нужно для его сворачивания при скролле. на Android
   * Material-бар не перекрывает контент.
   */
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  const topInset = (isIOS ? 0 : insets.top) + theme.spacing.sm;
  const bottomInset =
    contentBottomInset ??
    (isWeb
      ? insets.bottom + theme.sizes.tabBarHeight + theme.sizes.tabBarInset + theme.spacing.xxl
      : theme.spacing.xxl);

  const content = scrollable ? (
    <ScrollView
      {...scrollProps}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior={isIOS ? 'automatic' : 'never'}
      contentContainerStyle={[
        {
          paddingTop: topInset,
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