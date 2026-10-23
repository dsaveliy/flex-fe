import { LinearGradient } from 'expo-linear-gradient';
import { HeaderHeightContext } from 'expo-router/build/react-navigation/elements';
import { type ReactNode, useContext } from 'react';
import {
  Platform,
  RefreshControl,
  type ScrollViewProps,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { useTabBarShown } from './hooks/useTabBarShown';
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
  /**
   * блокировка прокрутки прямо из UI-потока (перетаскивание виджета): через
   * `scrollEnabled` из JS она доходит на несколько кадров позже, и страница успевает уехать за пальцем
   */
  scrollLock?: SharedValue<boolean>;
} & Pick<
  ScrollViewProps,
  | 'stickyHeaderIndices'
  | 'onScroll'
  | 'scrollEventThrottle'
  | 'onScrollBeginDrag'
  | 'scrollEnabled'
  | 'keyboardShouldPersistTaps'
  | 'automaticallyAdjustKeyboardInsets'
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
  scrollLock,
  ...scrollProps
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // высота шапки стека (профиль, регистрация); 0 — экран без шапки
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const tabBarShown = useTabBarShown();
  const lockProps = useAnimatedProps(() => ({ scrollEnabled: !scrollLock?.value }));

  /**
   * на web таб-бар свой и плавающий — отступы считаем вручную. на iOS
   * системный `UITabBar` сам выставляет инсеты ScrollView (статус-бар сверху,
   * бар снизу), это же нужно для его сворачивания при скролле. на Android
   * Material-бар не перекрывает контент.
   */
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  // на web прозрачная шапка лежит поверх контента: он начинается под ней (она уже включает чёлку)
  const topInset =
    (isIOS ? 0 : isWeb && headerHeight > 0 ? headerHeight : insets.top) + theme.spacing.sm;
  const bottomInset =
    contentBottomInset ??
    (isWeb
      ? insets.bottom +
        (tabBarShown ? theme.sizes.tabBarHeight + theme.sizes.tabBarInset : 0) +
        theme.spacing.xxl
      : theme.spacing.xxl);

  const content = scrollable ? (
    <Animated.ScrollView
      {...scrollProps}
      animatedProps={scrollLock ? lockProps : undefined}
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
    </Animated.ScrollView>
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
