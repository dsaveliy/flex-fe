import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  type CryptoWidgetParams,
  type MoverDirection,
  useCryptoLayout,
  useMarkets,
  useSaveCryptoLayout,
  type WidgetKind,
} from '@/api';
import { useCryptoSession } from '@/auth';
import { cellSize, widgetPixelSize } from '@/features/crypto/gridLayout';
import { PickerPill } from '@/features/crypto/PickerPill';
import { createWidget, WIDGET_KINDS, WIDGET_REGISTRY } from '@/features/crypto/widgets/registry';
import type { WidgetDefinition } from '@/features/crypto/widgets/types';
import { useTheme } from '@/theme';
import {
  type ActionMenuItem,
  GlassButton,
  Icon,
  PageDots,
  Text,
  Touchable,
  useAccessibilityFlags,
  useAppDimensions,
} from '@/ui';

/**
 * шторка с пулом виджетов рабочего стола Crypto (открывается «+» в режиме
 * редактирования). виды виджетов — строки-аккордеон: тап раскрывает превью
 * размеров (листаются, как в iOS), параметры и «Добавить». выбранный размер
 * добавляется в конец раскладки
 */
export default function WidgetGalleryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const scroll = useRef<ScrollView>(null);
  const [expanded, setExpanded] = useState<WidgetKind | null>(null);
  // строка, к которой прокрутить после раскрытия: её позиция известна только после раскладки
  const scrollTarget = useRef<WidgetKind | null>(null);
  const listY = useRef(0);
  const unlocked = Boolean(useCryptoSession().token);

  // раскладка — данные crypto-api: криптосессия закрылась — закрываем и шторку
  useEffect(() => {
    if (!unlocked && router.canGoBack()) router.back();
  }, [unlocked]);

  const toggle = (kind: WidgetKind) => {
    void Haptics.selectionAsync();
    const next = expanded === kind ? null : kind;
    scrollTarget.current = next;
    setExpanded(next);
  };

  return (
    <ScrollView
      ref={scroll}
      contentContainerStyle={{
        paddingVertical: theme.spacing.xxxl,
        gap: theme.spacing.xl,
      }}
    >
      <Text variant="title" style={{ paddingHorizontal: theme.spacing.xl }}>
        {t('crypto.gallery.title')}
      </Text>
      <View
        style={{ gap: theme.spacing.md }}
        onLayout={(event) => {
          listY.current = event.nativeEvent.layout.y;
        }}
      >
        {WIDGET_KINDS.map((kind) => (
          <GalleryItem
            key={kind}
            definition={WIDGET_REGISTRY[kind]}
            expanded={expanded === kind}
            onToggle={() => toggle(kind)}
            onLayoutY={(y) => {
              if (scrollTarget.current !== kind) return;
              scrollTarget.current = null;
              scroll.current?.scrollTo({
                y: Math.max(0, listY.current + y - theme.spacing.lg),
                animated: true,
              });
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

type GalleryItemProps = {
  definition: WidgetDefinition;
  expanded: boolean;
  onToggle: () => void;
  /** позиция строки в списке после раскладки — для прокрутки к раскрытой */
  onLayoutY: (y: number) => void;
};

function GalleryItem({ definition, expanded, onToggle, onLayoutY }: GalleryItemProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const { width: screenWidth } = useAppDimensions();
  const layout = useCryptoLayout();
  const save = useSaveCryptoLayout();
  const [params, setParams] = useState<CryptoWidgetParams>(definition.defaultParams ?? {});
  const [page, setPage] = useState(0);
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);

  // превью того же размера, что на рабочем столе
  const gap = theme.spacing.lg;
  const cell = cellSize(screenWidth - theme.spacing.xl * 2, gap);
  const heights = definition.sizes.map((size) => widgetPixelSize(size, cell, gap).height);
  const size = definition.sizes[page] ?? definition.sizes[0] ?? 'small';

  useEffect(() => {
    const angle = expanded ? 90 : 0;
    rotation.value = reduceMotion ? angle : withTiming(angle, { duration: theme.durations.normal });
  }, [expanded, reduceMotion, rotation, theme.durations.normal]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // высота пейджера следует за свайпом: под маленьким размером нет пустого места большого
  const pagerStyle = useAnimatedStyle(() => {
    if (heights.length < 2) return { height: heights[0] ?? 0 };
    return {
      height: interpolate(
        progress.value,
        heights.map((_, index) => index),
        heights,
        Extrapolation.CLAMP,
      ),
    };
  });

  const onScroll = useAnimatedScrollHandler((event) => {
    progress.value = event.contentOffset.x / screenWidth;
  });

  const toggle = () => {
    // пейджер монтируется заново с первой страницы
    if (!expanded) {
      setPage(0);
      progress.value = 0;
    }
    onToggle();
  };

  const add = () => {
    const widgets = layout.data?.widgets ?? [];
    save.mutate([...widgets, createWidget(definition.kind, size, params)]);
    router.back();
  };

  const { Component } = definition;

  return (
    // высота строки анимируется вместе со сдвигом строк ниже, а `overflow: hidden`
    // обрезает содержимое по ней: превью «выпадает» и не перекрывает соседей
    <Animated.View
      layout={reduceMotion ? undefined : LinearTransition.duration(theme.durations.normal)}
      onLayout={(event) => onLayoutY(event.nativeEvent.layout.y)}
      style={styles.clip}
    >
      <Touchable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t(definition.nameKey)}
        accessibilityHint={t(definition.descriptionKey)}
        haptic={false}
        onPress={toggle}
        style={{ marginHorizontal: theme.spacing.xl }}
      >
        <View
          style={[
            styles.row,
            styles.kindRow,
            {
              gap: theme.spacing.md,
              padding: theme.spacing.md,
              borderRadius: theme.radii.card,
              backgroundColor: theme.colors.glassFillStrong,
              borderColor: theme.colors.glassBorder,
            },
          ]}
        >
          <View
            style={[
              styles.center,
              {
                width: theme.sizes.touchTarget,
                height: theme.sizes.touchTarget,
                borderRadius: theme.sizes.touchTarget / 2,
                backgroundColor: theme.colors.accentMuted,
              },
            ]}
          >
            <Icon name={definition.icon} size={24} color={theme.colors.accent} />
          </View>
          <Text variant="headline" numberOfLines={1} style={styles.fill}>
            {t(definition.nameKey)}
          </Text>
          <Animated.View style={chevronStyle}>
            <Icon name="chevronRight" size={18} color={theme.colors.textMuted} />
          </Animated.View>
        </View>
      </Touchable>

      {/* без entering-анимации: в превью стеклянные плитки, а стекло не рисуется,
          если монтируется во время анимации прозрачности или масштаба */}
      {expanded ? (
        <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          <Text variant="body" color="textMuted" style={{ paddingHorizontal: theme.spacing.xl }}>
            {t(definition.descriptionKey)}
          </Text>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={definition.sizes.length > 1}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) =>
              setPage(Math.round(event.nativeEvent.contentOffset.x / screenWidth))
            }
            style={pagerStyle}
            contentContainerStyle={styles.pages}
          >
            {definition.sizes.map((pageSize) => {
              const pixels = widgetPixelSize(pageSize, cell, gap);
              return (
                <View
                  key={pageSize}
                  pointerEvents="none"
                  style={[styles.page, { width: screenWidth, height: pixels.height }]}
                >
                  <Component
                    widget={{
                      id: `preview-${definition.kind}-${pageSize}`,
                      kind: definition.kind,
                      size: pageSize,
                      params,
                    }}
                    size={pageSize}
                    width={pixels.width}
                    height={pixels.height}
                  />
                </View>
              );
            })}
          </Animated.ScrollView>

          <View style={[styles.center, { gap: theme.spacing.xs }]}>
            {definition.sizes.length > 1 ? (
              <PageDots count={definition.sizes.length} progress={progress} />
            ) : null}
            <Text variant="caption" color="textMuted">
              {t(`crypto.sizes.${size}`)}
            </Text>
          </View>

          <View
            style={[
              styles.row,
              styles.wrap,
              { gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xl },
            ]}
          >
            <WidgetOptions definition={definition} params={params} onChange={setParams} />
            <GlassButton
              label={t('crypto.gallery.add')}
              icon="plus"
              accent
              onPress={add}
              style={styles.grow}
            />
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

/** настройки виджета перед добавлением: монета, направление, пара обмена */
function WidgetOptions({
  definition,
  params,
  onChange,
}: {
  definition: WidgetDefinition;
  params: CryptoWidgetParams;
  onChange: (params: CryptoWidgetParams) => void;
}) {
  const { t } = useTranslation();
  const markets = useMarkets('crypto');
  const assets = markets.data ?? [];
  const symbolOf = (id?: string) => assets.find((item) => item.id === id)?.symbol ?? '—';

  const assetItems = (selected: string | undefined, pick: (id: string) => void): ActionMenuItem[] =>
    assets.map((item) => ({
      id: item.id,
      label: `${item.symbol} · ${item.name}`,
      checked: item.id === selected,
      onPress: () => pick(item.id),
    }));

  return (
    <>
      {definition.options?.includes('asset') ? (
        <PickerPill
          label={symbolOf(params.assetId)}
          title={t('crypto.gallery.chooseAsset')}
          items={assetItems(params.assetId, (assetId) => onChange({ ...params, assetId }))}
        />
      ) : null}
      {definition.options?.includes('direction') ? (
        <PickerPill
          label={t(`crypto.segments.${params.direction ?? 'gainers'}`)}
          title={t('crypto.gallery.chooseDirection')}
          items={(['gainers', 'losers'] as MoverDirection[]).map((direction) => ({
            id: direction,
            label: t(`crypto.segments.${direction}`),
            checked: direction === (params.direction ?? 'gainers'),
            onPress: () => onChange({ ...params, direction }),
          }))}
        />
      ) : null}
      {definition.options?.includes('pair') ? (
        <>
          <PickerPill
            label={symbolOf(params.from)}
            title={t('crypto.gallery.chooseFrom')}
            items={assetItems(params.from, (from) => onChange({ ...params, from }))}
          />
          <Icon name="chevronRight" size={16} />
          <PickerPill
            label={symbolOf(params.to)}
            title={t('crypto.gallery.chooseTo')}
            items={assetItems(params.to, (to) => onChange({ ...params, to }))}
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  clip: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kindRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  pages: {
    alignItems: 'flex-start',
  },
  wrap: {
    flexWrap: 'wrap',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    alignItems: 'center',
  },
  grow: {
    flexGrow: 1,
  },
});
