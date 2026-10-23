import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { BankCard } from '@/api';
import { useTheme } from '@/theme';
import { PageDots, Touchable, useAccessibilityFlags, useAppDimensions, useTilt } from '@/ui';

import { BankCardBack } from './BankCardBack';
import { BankCardView } from './BankCardView';
import { CardStrip } from './CardStrip';
import { MINI_CARD_WIDTH } from './MiniCard';

/** поворот соседней карты при перелистывании, в градусах */
const FLIP_DEG = 24;
/** насколько повёрнутая соседняя карта подтягивается к центру (доля ширины) */
const FLIP_PULL = 0.06;
/** доля разрыва, которую лента догоняет за кадр — мягкое «следование» */
const STRIP_FOLLOW = 0.35;

export type CardPagerProps = {
  cards: BankCard[];
  index: number;
  onIndexChange: (index: number) => void;
  /** активная карта перевёрнута реквизитами вверх */
  flipped: boolean;
  /** тап по активной карте */
  onCardPress?: () => void;
  /** пользователь начал листать — перевёрнутую карту пора вернуть */
  onDragStart?: () => void;
};

/**
 * большая карусель карт + точки + лента мини-карт, всё синхронно.
 * единственный источник правды — сдвиг большой карусели (`progress` —
 * дробный индекс): от него перетекают точки и подсветка мини-карт, лента
 * сама докручивается к активной. тап по мини-карте листает большую.
 */
export function CardPager({
  cards,
  index,
  onIndexChange,
  flipped,
  onCardPress,
  onDragStart,
}: CardPagerProps) {
  const theme = useTheme();
  const { width: screenWidth } = useAppDimensions();
  const { reduceMotion } = useAccessibilityFlags();
  const { tiltStyle, tiltX, tiltY } = useTilt({ maxDeg: 5, enabled: useIsFocused() });

  const bigRef = useAnimatedRef<Animated.ScrollView>();
  const stripRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const lastIndex = useSharedValue(index);
  const stripOffset = useSharedValue(0);
  const stripManual = useSharedValue(false);
  const lastHaptic = useRef(0);

  const cardWidth = screenWidth - theme.spacing.xl * 2;
  const step = cardWidth + theme.spacing.md;
  const miniStep = MINI_CARD_WIDTH + theme.spacing.md;
  const stripMax = Math.max(
    0,
    theme.spacing.xl * 2 + cards.length * miniStep - theme.spacing.md - screenWidth,
  );

  const progress = useDerivedValue(() => scrollX.value / step);

  const handleIndex = useCallback(
    (next: number) => {
      // лёгкий щелчок при смене карты, но не дребезг при быстрой прокрутке
      const now = Date.now();
      if (now - lastHaptic.current > 80) void Haptics.selectionAsync();
      lastHaptic.current = now;
      onIndexChange(next);
    },
    [onIndexChange],
  );

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      stripManual.value = false;
      if (onDragStart) scheduleOnRN(onDragStart);
    },
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const next = Math.min(
        cards.length - 1,
        Math.max(0, Math.round(event.contentOffset.x / step)),
      );
      if (next !== lastIndex.value) {
        lastIndex.value = next;
        scheduleOnRN(handleIndex, next);
      }
    },
  });

  // лента держит активную мини-карту по центру экрана, пока листают большую
  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (previous === null || stripManual.value) return;
      const center = theme.spacing.xl + current * miniStep + MINI_CARD_WIDTH / 2;
      const target = Math.min(stripMax, Math.max(0, center - screenWidth / 2));
      // карусель встала на карту — докручиваем точно и плавно
      if (Math.abs(current - Math.round(current)) < 0.001) {
        scrollTo(stripRef, target, 0, true);
        stripOffset.value = target;
        return;
      }
      const next = stripOffset.value + (target - stripOffset.value) * STRIP_FOLLOW;
      scrollTo(stripRef, next, 0, false);
      stripOffset.value = next;
    },
  );

  const selectCard = (target: number) => {
    stripManual.value = false;
    bigRef.current?.scrollTo({ x: target * step, animated: !reduceMotion });
  };

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <Animated.ScrollView
        ref={bigRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        // место под тень пластика, иначе ScrollView её обрежет
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
        style={{ marginVertical: -theme.spacing.lg }}
      >
        {cards.map((card, cardIndex) => (
          <PagerItem
            key={card.id}
            card={card}
            index={cardIndex}
            active={cardIndex === index}
            width={cardWidth}
            step={step}
            scrollX={scrollX}
            tiltX={tiltX}
            tiltY={tiltY}
            tiltStyle={tiltStyle}
            flat={reduceMotion}
            flipped={cardIndex === index && flipped}
            onPress={cardIndex === index ? onCardPress : undefined}
          />
        ))}
      </Animated.ScrollView>

      {cards.length > 1 ? (
        <>
          <PageDots count={cards.length} progress={progress} />
          <CardStrip
            cards={cards}
            index={index}
            progress={progress}
            scrollRef={stripRef}
            offset={stripOffset}
            manual={stripManual}
            onSelect={selectCard}
          />
        </>
      ) : null}
    </View>
  );
}

type PagerItemProps = {
  card: BankCard;
  index: number;
  active: boolean;
  width: number;
  step: number;
  scrollX: SharedValue<number>;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  tiltStyle: ReturnType<typeof useTilt>['tiltStyle'];
  /** Reduce Motion: без поворота при перелистывании */
  flat: boolean;
  flipped: boolean;
  onPress?: () => void;
};

/**
 * карта в карусели: соседние уменьшены, приглушены и повёрнуты (3D-перелистывание),
 * блик едет вместе со свайпом, а у активной ещё и за наклоном телефона
 */
function PagerItem({
  card,
  index,
  active,
  width,
  step,
  scrollX,
  tiltX,
  tiltY,
  tiltStyle,
  flat,
  flipped,
  onPress,
}: PagerItemProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const flip = useSharedValue(flipped ? 1 : 0);

  useEffect(() => {
    const target = flipped ? 1 : 0;
    flip.value = flat ? target : withSpring(target, theme.springs.flip);
  }, [flat, flip, flipped, theme.springs.flip]);

  // стороны поворачиваются вместе; невидимая скрыта и прозрачностью — backfaceVisibility
  // на Android работает не везде
  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.value * 180 - 180}deg` }],
  }));
  const itemStyle = useAnimatedStyle(() => {
    const rel = Math.max(-1, Math.min(1, (scrollX.value - index * step) / step));
    const distance = Math.abs(rel);
    return {
      opacity: 1 - distance * 0.35,
      transform: [
        { perspective: 1000 },
        { translateX: flat ? 0 : rel * width * FLIP_PULL },
        { rotateY: `${flat ? 0 : rel * FLIP_DEG}deg` },
        { scale: 1 - distance * 0.08 },
      ],
    };
  });

  // свет для бликов и переливания: от свайпа — сразу, от наклона телефона —
  // мягко через пружину и только у активной карты
  const tiltLightX = useSharedValue(0);
  const tiltLightY = useSharedValue(0);
  useAnimatedReaction(
    () => (active ? [tiltX.value, tiltY.value] : [0, 0]),
    ([x, y]) => {
      tiltLightX.value = withSpring(x, theme.springs.tilt);
      tiltLightY.value = withSpring(y, theme.springs.tilt);
    },
    [active],
  );
  const lightX = useDerivedValue(() => {
    const rel = Math.max(-1, Math.min(1, (scrollX.value - index * step) / step));
    return -rel * 1.2 - tiltLightX.value;
  });
  const lightY = useDerivedValue(() => tiltLightY.value);

  return (
    <Animated.View style={itemStyle}>
      {/* перевёрнутая карта отдаёт фокус VoiceOver реквизитам внутри */}
      <Touchable
        accessible={!flipped}
        accessibilityRole="button"
        accessibilityLabel={`${card.productName}, ${t(`cards.kinds.${card.kind}`)}, •••• ${
          card.last4
        }${card.status === 'frozen' ? `, ${t('cards.frozen')}` : ''}`}
        accessibilityHint={t('cards.a11y.flipHint')}
        disabled={!onPress}
        onPress={onPress}
        pressedScale={0.98}
      >
        <Animated.View style={active ? tiltStyle : undefined}>
          <Animated.View style={[styles.face, frontStyle]}>
            <BankCardView
              card={card}
              width={width}
              light={{ x: lightX, y: lightY }}
              active={active}
            />
          </Animated.View>
          {active ? (
            <Animated.View
              pointerEvents={flipped ? 'auto' : 'none'}
              style={[StyleSheet.absoluteFill, styles.face, backStyle]}
            >
              <BankCardBack card={card} width={width} flipped={flipped} />
            </Animated.View>
          ) : null}
        </Animated.View>
      </Touchable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  face: {
    backfaceVisibility: 'hidden',
  },
});
