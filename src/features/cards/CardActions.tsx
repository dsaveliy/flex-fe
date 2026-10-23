import { router } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { BankCard } from '@/api';
import { useTheme } from '@/theme';
import { ActionCircle, GlassGroup, type IconName, useAccessibilityFlags } from '@/ui';

import { CARD_EXTRA_ACTIONS } from './cardExtraActions';

type Cell = {
  id: string;
  icon: IconName;
  label: string;
  onPress?: () => void;
  accent?: boolean;
  selected?: boolean;
};

export type CardActionsProps = {
  card: BankCard;
  /** карта перевёрнута реквизитами вверх */
  flipped: boolean;
  /** раскрыты ли дополнительные ряды («Ещё») */
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleFlip: () => void;
  onToggleFreeze: () => void;
};

/**
 * действия с картой: ряд стеклянных кругов как на Home. «Ещё» раскрывает
 * под ним два ряда таких же кругов. ячейки равной ширины, чтобы колонки
 * всех рядов совпадали.
 *
 * дополнительные ряды смонтированы всегда и спрятаны в «ящик» нулевой высоты:
 * нативное стекло не отрисовывается, если создаётся посреди анимации
 * появления (масштаб или прозрачность), поэтому анимируется только высота
 * ящика и лёгкий сдвиг рядов.
 */
export function CardActions({
  card,
  flipped,
  expanded,
  onToggleExpanded,
  onToggleFlip,
  onToggleFreeze,
}: CardActionsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const [drawerHeight, setDrawerHeight] = useState(0);
  const open = useSharedValue(0);
  const frozen = card.status === 'frozen';

  const main: Cell[] = [
    // перевод и пополнение — со счёта этой карты и на него
    {
      id: 'transfer',
      icon: 'transfer',
      label: t('cards.actions.transfer'),
      onPress: () => router.push({ pathname: '/transfer', params: { from: card.accountId } }),
    },
    {
      id: 'topUp',
      icon: 'plus',
      label: t('cards.actions.topUp'),
      accent: true,
      onPress: () => router.push({ pathname: '/top-up', params: { to: card.accountId } }),
    },
    {
      id: 'freeze',
      icon: 'snowflake',
      label: frozen ? t('cards.actions.unfreeze') : t('cards.actions.freeze'),
      selected: frozen,
      onPress: onToggleFreeze,
    },
    {
      id: 'more',
      icon: expanded ? 'chevronUp' : 'more',
      label: expanded ? t('cards.actions.collapse') : t('cards.actions.more'),
      onPress: onToggleExpanded,
    },
  ];

  const extra: Cell[][] = CARD_EXTRA_ACTIONS.map((row) =>
    row.map((action) =>
      action.id === 'details'
        ? {
            id: action.id,
            // иконка показывает, что сделает нажатие: перевернуть карту или вернуть её
            icon: flipped ? 'undo' : action.icon,
            label: t(action.labelKey),
            selected: flipped,
            onPress: onToggleFlip,
          }
        : { id: action.id, icon: action.icon, label: t(action.labelKey) },
    ),
  );

  useEffect(() => {
    const target = expanded ? 1 : 0;
    open.value = reduceMotion
      ? target
      : withTiming(target, { duration: theme.durations.normal, easing: Easing.out(Easing.cubic) });
  }, [expanded, open, reduceMotion, theme.durations.normal]);

  const drawerStyle = useAnimatedStyle(() => ({ height: drawerHeight * open.value }));

  const circle = (cell: Cell) => (
    <ActionCircle
      icon={cell.icon}
      label={cell.label}
      accent={cell.accent}
      selected={cell.selected}
      onPress={cell.onPress}
    />
  );

  return (
    <View>
      <GlassGroup spacing={theme.spacing.md} style={styles.row}>
        {main.map((cell) => (
          <View key={cell.id} style={styles.cell}>
            {circle(cell)}
          </View>
        ))}
      </GlassGroup>

      {/* ящик вне стеклянного контейнера: контейнер рисует стекло вложенных кнопок
          в обход обрезки, и верхушки кругов торчали бы из-под ящика.
          операции под ящиком сдвигаются вместе с его высотой */}
      <Animated.View
        pointerEvents={expanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        style={[styles.drawer, drawerStyle]}
      >
        {/* содержимое вынесено абсолютно, чтобы его естественная высота
            измерялась независимо от текущей высоты ящика */}
        <View
          onLayout={(event) => setDrawerHeight(event.nativeEvent.layout.height)}
          style={[styles.drawerContent, { paddingTop: theme.spacing.lg, gap: theme.spacing.lg }]}
        >
          {extra.map((row, rowIndex) => (
            <DrawerRow key={rowIndex} open={open} depth={rowIndex + 1}>
              {row.map((cell) => (
                <View key={cell.id} style={styles.cell}>
                  {circle(cell)}
                </View>
              ))}
            </DrawerRow>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/** ряд в ящике: слегка съезжает на место, нижний ряд — чуть дальше */
function DrawerRow({
  open,
  depth,
  children,
}: {
  open: SharedValue<number>;
  depth: number;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(open.value, [0, 1], [-8 * depth, 0]) }],
  }));

  return <Animated.View style={[styles.row, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  drawer: {
    overflow: 'hidden',
  },
  drawerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
