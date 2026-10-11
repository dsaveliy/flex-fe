import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  ZoomOut,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { CryptoWidget } from '@/api';
import { useTheme } from '@/theme';
import { Icon, Touchable } from '@/ui';

import { WIDGET_REGISTRY } from './widgets/registry';

/** прямоугольник ячейки в точках внутри сетки */
export type TileRect = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** амплитуда покачивания маленького виджета, градусы */
const JIGGLE_DEG = 1.5;
/** сторона, начиная с которой угол покачивания уменьшается: у крупных виджетов углы ходят размашистее */
const JIGGLE_REF_SIDE = 170;
/** период одного качания, мс; у каждого виджета чуть свой, чтобы не качались в такт */
const JIGGLE_PERIOD = 280;
/** лёгкое подрагивание вверх-вниз поверх поворота, точки */
const JIGGLE_BOB = 0.6;
/** насколько виджет «приподнимается» под пальцем */
const LIFT_SCALE = 0.06;
const MINUS_SIZE = 24;

export type WidgetTileProps = {
  widget: CryptoWidget;
  rect: TileRect;
  editing: boolean;
  /** покачивание разрешено: экран в фокусе и не включён Reduce Motion */
  jiggle: boolean;
  /** ячейки всех виджетов — по ним палец находит, на чьё место встать */
  slots: SharedValue<TileRect[]>;
  /** блокировка прокрутки экрана, пока виджет под пальцем */
  scrollLock: SharedValue<boolean>;
  onEnterEdit: () => void;
  onDragStart: () => void;
  onHover: (draggedId: string, targetId: string) => void;
  onDragEnd: () => void;
  onRemove: (id: string) => void;
  /** тап вне редактирования — открыть связанный раздел */
  onOpen?: () => void;
};

/** стабильное число 0..1 из id — у каждого виджета своя фаза покачивания */
function phaseOf(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 1000) / 1000;
}

/**
 * виджет на рабочем столе. вне редактирования долгое нажатие включает режим
 * редактирования и сразу хватает виджет, как на iPhone. в режиме
 * редактирования виджет покачивается, показывает «−» и перетаскивается
 */
export function WidgetTile({
  widget,
  rect,
  editing,
  jiggle,
  slots,
  scrollLock,
  onEnterEdit,
  onDragStart,
  onHover,
  onDragEnd,
  onRemove,
  onOpen,
}: WidgetTileProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const definition = WIDGET_REGISTRY[widget.kind];

  const left = useSharedValue(rect.x);
  const top = useSharedValue(rect.y);
  // ячейка, в которую виджет вернётся, когда его отпустят
  const homeX = useSharedValue(rect.x);
  const homeY = useSharedValue(rect.y);
  const dragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastTarget = useSharedValue('');
  const lift = useSharedValue(0);
  const press = useSharedValue(0);
  // покачивание: бегущая фаза и амплитуда, которая плавно нарастает и затухает
  const clock = useSharedValue(0);
  const amp = useSharedValue(0);
  const minus = useSharedValue(editing ? 1 : 0);
  const mounted = useRef(false);

  // соседи переехали — плавно едем в новую ячейку (схваченный виджет остаётся под пальцем)
  useEffect(() => {
    homeX.value = rect.x;
    homeY.value = rect.y;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!dragging.value) {
      left.value = withSpring(rect.x, theme.springs.pill);
      top.value = withSpring(rect.y, theme.springs.pill);
    }
  }, [dragging, homeX, homeY, left, rect.x, rect.y, theme.springs.pill, top]);

  useEffect(() => {
    minus.value = withTiming(editing ? 1 : 0, {
      duration: theme.durations.normal,
      easing: Easing.inOut(Easing.quad),
    });
  }, [editing, minus, theme.durations.normal]);

  const phase = phaseOf(widget.id);
  const jiggleDeg = JIGGLE_DEG * Math.min(1, JIGGLE_REF_SIDE / Math.max(rect.w, rect.h));

  useEffect(() => {
    const ease = { duration: theme.durations.slow, easing: Easing.inOut(Easing.quad) };
    if (editing && jiggle) {
      // фаза бежит равномерно, а амплитуда растёт с нуля — без рывка в первое положение
      cancelAnimation(clock);
      clock.value = 0;
      clock.value = withRepeat(
        withTiming(1, { duration: JIGGLE_PERIOD + phase * 60, easing: Easing.linear }),
        -1,
        false,
      );
      amp.value = withTiming(1, ease);
    } else {
      amp.value = withTiming(0, ease, (finished) => {
        if (finished) cancelAnimation(clock);
      });
    }
  }, [amp, clock, editing, jiggle, phase, theme.durations.slow]);

  const grab = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!editing) onEnterEdit();
    onDragStart();
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(editing ? 120 : 400)
    .onStart(() => {
      scrollLock.value = true;
      dragging.value = true;
      startX.value = left.value;
      startY.value = top.value;
      lastTarget.value = '';
      lift.value = withSpring(1, theme.springs.press);
      scheduleOnRN(grab);
    })
    .onUpdate((event) => {
      left.value = startX.value + event.translationX;
      top.value = startY.value + event.translationY;

      // центр схваченного виджета над чужой ячейкой — встаём на её место
      const cx = left.value + rect.w / 2;
      const cy = top.value + rect.h / 2;
      let target = '';
      for (const slot of slots.value) {
        if (cx >= slot.x && cx <= slot.x + slot.w && cy >= slot.y && cy <= slot.y + slot.h) {
          target = slot.id;
          break;
        }
      }
      if (target === widget.id || target === '') {
        lastTarget.value = '';
      } else if (target !== lastTarget.value) {
        lastTarget.value = target;
        scheduleOnRN(onHover, widget.id, target);
      }
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      scrollLock.value = false;
      dragging.value = false;
      left.value = withSpring(homeX.value, theme.springs.pill);
      top.value = withSpring(homeY.value, theme.springs.pill);
      lift.value = withSpring(0, theme.springs.press);
      scheduleOnRN(onDragEnd);
    });

  const open = () => {
    void Haptics.selectionAsync();
    onOpen?.();
  };

  // короткий тап открывает раздел; он срабатывает, только если не началось перетаскивание
  const tap = Gesture.Tap()
    .enabled(!editing && Boolean(onOpen))
    .maxDuration(380)
    .onBegin(() => {
      press.value = withTiming(1, { duration: theme.durations.fast });
    })
    .onEnd((_event, success) => {
      if (success) scheduleOnRN(open);
    })
    .onFinalize(() => {
      press.value = withTiming(0, { duration: theme.durations.fast });
    });

  const gesture = Gesture.Exclusive(pan, tap);

  // позиция — на внешнем слое (с анимацией удаления), покачивание и подъём — на внутреннем,
  // чтобы layout-анимация не перетирала transform
  const positionStyle = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    zIndex: dragging.value ? 10 : 0,
  }));

  const tileStyle = useAnimatedStyle(() => {
    // под пальцем виджет не качается
    const a = amp.value * (1 - lift.value);
    const angle = 2 * Math.PI * (clock.value + phase);
    return {
      shadowOpacity: lift.value * 0.2,
      transform: [
        // подрагивание с удвоенной частотой — качание выглядит живым, а не маятником
        { translateY: Math.sin(2 * angle + phase * Math.PI) * JIGGLE_BOB * a },
        { scale: 1 + lift.value * LIFT_SCALE - press.value * 0.03 },
        { rotate: `${Math.sin(angle) * jiggleDeg * a}deg` },
      ],
    };
  });

  const minusStyle = useAnimatedStyle(() => ({
    opacity: minus.value * (1 - lift.value),
    transform: [{ scale: minus.value }],
  }));

  const { Component } = definition;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        exiting={ZoomOut.duration(theme.durations.normal)}
        accessibilityHint={editing ? undefined : t('crypto.a11y.widgetHint')}
        style={[styles.position, { width: rect.w, height: rect.h }, positionStyle]}
      >
        <Animated.View style={[styles.tile, { shadowColor: theme.colors.shadow }, tileStyle]}>
          {/* в режиме редактирования содержимое виджета не нажимается */}
          <View pointerEvents={editing ? 'none' : 'auto'} style={styles.fill}>
            <Component widget={widget} size={widget.size} width={rect.w} height={rect.h} />
          </View>

          <Animated.View
            pointerEvents={editing ? 'auto' : 'none'}
            style={[styles.minus, minusStyle]}
          >
            <Touchable
              accessibilityRole="button"
              accessibilityLabel={t('crypto.a11y.removeWidget', {
                name: t(definition.nameKey),
              })}
              hitSlop={10}
              onPress={() => onRemove(widget.id)}
              style={[
                styles.minusButton,
                {
                  backgroundColor: theme.colors.textMuted,
                  borderColor: theme.colors.glassBorder,
                },
              ]}
            >
              <Icon name="minus" size={16} strokeWidth={2.6} color={theme.colors.textInverse} />
            </Touchable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
  },
  tile: {
    flex: 1,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
  },
  fill: {
    flex: 1,
  },
  minus: {
    position: 'absolute',
    top: -MINUS_SIZE / 3,
    left: -MINUS_SIZE / 3,
  },
  minusButton: {
    width: MINUS_SIZE,
    height: MINUS_SIZE,
    borderRadius: MINUS_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
