import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type BankCard, useCardDetails } from '@/api';
import { useTheme } from '@/theme';
import { Icon, Text, Touchable, useAccessibilityFlags } from '@/ui';

export type CardDetailsBlockProps = {
  card: BankCard;
  /** цвет текста — цвет пластика */
  ink: string;
  /** реквизиты раскрыты; запрос `GET /cards/{id}/details` идёт только тогда */
  revealed: boolean;
  /** тап по реквизитам: раскрыть (после проверки доступа) или скрыть */
  onPress: () => void;
};

/** `4532718209344821` → `4532 7182 0934 4821` */
function groupPan(pan: string): string {
  return pan.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * реквизиты на обороте карты. по умолчанию скрыты точками; тап по ним
 * раскрывает номер, срок, CVV и держателя, повторный тап — скрывает.
 */
export function CardDetailsBlock({ card, ink, revealed, onPress }: CardDetailsBlockProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const details = useCardDetails(card.id, { enabled: revealed });

  const shown = revealed && details.data ? details.data : null;
  const loading = revealed && details.isPending;
  const fade = reduceMotion ? undefined : FadeIn.duration(theme.durations.normal);
  const muted = { color: ink, opacity: 0.6 };

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={revealed ? t('cards.details.hide') : t('cards.details.show')}
      onPress={onPress}
      pressedScale={0.98}
    >
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <View style={styles.row}>
            <Text variant="caption" style={[muted, styles.grow]}>
              {t('cards.details.number')}
            </Text>
            {/* подсказка, что реквизиты раскрываются по тапу */}
            <View style={[styles.row, { gap: theme.spacing.xs }]}>
              <Text variant="caption" style={muted}>
                {revealed ? t('cards.details.tapToHide') : t('cards.details.tapToShow')}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color={ink} />
              ) : (
                <Icon name={revealed ? 'eyeOff' : 'eye'} size={16} color={ink} />
              )}
            </View>
          </View>
          <Animated.View key={shown ? 'pan' : 'mask'} entering={fade}>
            <Text
              variant="sectionTitle"
              selectable={Boolean(shown)}
              style={[styles.digits, { color: ink }]}
            >
              {shown ? groupPan(shown.pan) : `••••  ••••  ••••  ${card.last4}`}
            </Text>
          </Animated.View>
        </View>

        <View style={[styles.row, { gap: theme.spacing.xxl }]}>
          <View style={{ gap: theme.spacing.xxs }}>
            <Text variant="caption" style={muted}>
              {t('cards.details.expiry')}
            </Text>
            <Text variant="bodyStrong" style={[styles.digits, { color: ink }]}>
              {shown ? shown.expiry : '••/••'}
            </Text>
          </View>
          <View style={{ gap: theme.spacing.xxs }}>
            <Text variant="caption" style={muted}>
              {t('cards.details.cvv')}
            </Text>
            <Text variant="bodyStrong" style={[styles.digits, { color: ink }]}>
              {shown ? shown.cvv : '•••'}
            </Text>
          </View>
          {shown ? (
            <Animated.View entering={fade} style={[styles.grow, { gap: theme.spacing.xxs }]}>
              <Text variant="caption" style={muted}>
                {t('cards.details.holder')}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1} style={{ color: ink }}>
                {shown.holderName}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grow: {
    flex: 1,
  },
  digits: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
});
