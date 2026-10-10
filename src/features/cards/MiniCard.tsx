import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  type SharedValue,
  useAnimatedStyle,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import type { BankCard } from '@/api';
import { palette, useTheme } from '@/theme';
import { FlexLogo, Icon, PrivateAmount, Text, Touchable, useAccessibilityFlags } from '@/ui';
import { formatMoney } from '@/utils/money';

import { CardBrandMark } from './CardBrandMark';
import { CARD_SKINS, WHITE_TRANSPARENT } from './cardStyles';

/** ширина мини-карты в ленте */
export const MINI_CARD_WIDTH = 120;
/** масштаб графики относительно большой карты (335pt в макете) */
const UNIT = 0.5;
/** на сколько подсветка выступает за край мини-карты */
const RING_OUTSET = 3;

export type MiniCardProps = {
  card: BankCard;
  index: number;
  /** дробный индекс большой карусели: подсветка перетекает вместе со свайпом */
  progress: SharedValue<number>;
  onPress: () => void;
  selected: boolean;
};

/**
 * мини-карта в ленте под каруселью: градиент пластика, баланс и знак
 * платёжной системы. акцентная рамка со свечением, логотип и лёгкое
 * увеличение зависят от расстояния до текущей позиции карусели, поэтому
 * подсветка «переезжает» с карты на карту прямо во время свайпа.
 */
export function MiniCard({ card, index, progress, onPress, selected }: MiniCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const skin = CARD_SKINS[card.style];
  const height = MINI_CARD_WIDTH / theme.sizes.cardAspectRatio;
  const radius = theme.radii.md;
  const frozen = card.status === 'frozen';

  const focusStyle = useAnimatedStyle(() => {
    const closeness = 1 - Math.min(1, Math.abs(progress.value - index));
    return { transform: [{ scale: 1 + closeness * 0.04 }] };
  });
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.abs(progress.value - index)),
  }));

  return (
    <Touchable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={t('cards.a11y.selectCard', { last4: card.last4 })}
      onPress={onPress}
    >
      <Animated.View style={[{ width: MINI_CARD_WIDTH, height }, focusStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderRadius: radius + RING_OUTSET,
              borderColor: theme.colors.accent,
              shadowColor: theme.colors.accent,
            },
            ringStyle,
          ]}
        />
        <View style={[styles.clip, { borderRadius: radius }, theme.shadows.soft]}>
          <LinearGradient
            colors={skin.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          />
          <LinearGradient
            colors={[palette.white, WHITE_TRANSPARENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.7 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius, opacity: 0.3 }]}
          />

          {/* у замороженной карты пластик холодеет */}
          {frozen ? (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.duration(theme.durations.slow)}
              exiting={reduceMotion ? undefined : FadeOut.duration(theme.durations.slow)}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: radius, backgroundColor: palette.ice, opacity: 0.45 },
              ]}
            />
          ) : null}

          <View style={[styles.content, { padding: theme.spacing.sm }]}>
            <View style={styles.row}>
              <Animated.View style={ringStyle}>
                <FlexLogo size={16} />
              </Animated.View>
              {frozen ? (
                <Animated.View
                  entering={reduceMotion ? undefined : ZoomIn.springify()}
                  exiting={reduceMotion ? undefined : ZoomOut}
                >
                  <Icon name="snowflake" size={14} color={skin.ink} />
                </Animated.View>
              ) : null}
            </View>

            <View style={[styles.row, styles.bottom]}>
              <View style={[styles.row, styles.bottom, { gap: theme.spacing.xxs, flexShrink: 1 }]}>
                <PrivateAmount maskVariant="bodyStrong" maskColorValue={skin.ink}>
                  <Text variant="bodyStrong" numberOfLines={1} style={{ color: skin.ink }}>
                    {formatMoney(card.balance, { withCurrency: false })}
                  </Text>
                </PrivateAmount>
                <Text variant="micro" style={{ color: skin.ink, opacity: 0.7 }}>
                  {card.balance.currency}
                </Text>
              </View>
              <CardBrandMark brand={card.brand} ink={skin.ink} unit={UNIT} />
            </View>
          </View>
        </View>
      </Animated.View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -RING_OUTSET,
    left: -RING_OUTSET,
    right: -RING_OUTSET,
    bottom: -RING_OUTSET,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  clip: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottom: {
    alignItems: 'flex-end',
  },
});
