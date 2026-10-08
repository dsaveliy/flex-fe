import type { ReactNode } from 'react';
import { StyleSheet, type TextStyle, View, type ViewStyle } from 'react-native';

import { type ThemeColors, type TypographyToken, useTheme } from '@/theme';
import { type Money, splitMoneyParts } from '@/utils/money';

import { AnimatedNumber } from './AnimatedNumber';
import { PrivateAmount } from './PrivateAmount';
import { Text } from './Text';

type AmountSize = 'hero' | 'display' | 'title';

/** вертикальные метрики Inter (hhea) в долях кегля */
const INTER_ASCENT = 0.96875;
const INTER_DESCENT = 0.2412;

/**
 * расстояние от низа строки до базовой линии. iOS центрирует строку шрифта
 * (ascent + descent) внутри lineHeight, поэтому у разных кеглей запас под
 * базовой линией разный — без поправки мелкие части «проседают».
 */
function baselineFromBottom(style: TextStyle): number {
  const fontSize = style.fontSize ?? 14;
  const lineHeight = style.lineHeight ?? fontSize * 1.2;
  return (lineHeight - fontSize * (INTER_ASCENT + INTER_DESCENT)) / 2 + fontSize * INTER_DESCENT;
}

const SIZE_TOKENS: Record<
  AmountSize,
  { integer: TypographyToken; fraction: TypographyToken; currency: TypographyToken }
> = {
  hero: { integer: 'hero', fraction: 'heroCents', currency: 'sectionTitle' },
  display: { integer: 'display', fraction: 'balanceCents', currency: 'balanceCurrency' },
  title: { integer: 'title', fraction: 'sectionTitle', currency: 'caption' },
};

export type MoneyAmountProps = {
  value: Money;
  size?: AmountSize;
  /** знаков в минорных единицах `value` (2 для фиата, 8 для крипты) */
  minorUnitDigits?: number;
  /** сколько знаков дробной части показывать; по умолчанию все */
  fractionDigits?: number;
  showCurrency?: boolean;
  /**
   * своя отрисовка валюты (например, кнопка-меню выбора валюты); получает
   * код валюты и стоит на той же базовой линии, что и сумма
   */
  renderCurrency?: (currency: string) => ReactNode;
  color?: keyof ThemeColors;
  /** участвует в режиме «скрыть баланс» */
  privacy?: boolean;
  /** тап по сумме переключает скрытие */
  toggleOnPress?: boolean;
  style?: ViewStyle;
};

/**
 * крупная сумма: целая часть и копейки перекатываются отдельно, валюта —
 * приглушённым текстом. стандартный способ показать деньги на «живых» виджетах.
 */
export function MoneyAmount({
  value,
  size = 'display',
  minorUnitDigits = 2,
  fractionDigits,
  showCurrency = true,
  renderCurrency,
  color = 'textPrimary',
  privacy = true,
  toggleOnPress = false,
  style,
}: MoneyAmountProps) {
  const theme = useTheme();
  const tokens = SIZE_TOKENS[size];
  const parts = splitMoneyParts(value, { minorUnitDigits });
  const fraction = fractionDigits === undefined ? parts.fraction : parts.fraction.slice(0, fractionDigits);

  // все части стоят на общей базовой линии целой части
  const integerBaseline = baselineFromBottom(theme.typography[tokens.integer]);
  const fractionShift = integerBaseline - baselineFromBottom(theme.typography[tokens.fraction]);
  const currencyShift = integerBaseline - baselineFromBottom(theme.typography[tokens.currency]);

  const digits = (
    <View style={[styles.row, { gap: theme.spacing.xxs }]}>
      <AnimatedNumber value={parts.integer} variant={tokens.integer} color={color} />
      {fraction.length > 0 ? (
        <AnimatedNumber
          value={`.${fraction}`}
          variant={tokens.fraction}
          color={color}
          style={{ opacity: 0.55 }}
          containerStyle={{ marginBottom: fractionShift }}
        />
      ) : null}
    </View>
  );

  // валюта стоит вне скрываемой части: «•••••• BYN», и её кнопка не
  // конфликтует с тапом по сумме, переключающим скрытие
  const currency = showCurrency ? (
    <View style={{ marginLeft: theme.spacing.xs, marginBottom: currencyShift }}>
      {renderCurrency ? (
        renderCurrency(parts.currency)
      ) : (
        <Text variant={tokens.currency} color="textMuted">
          {parts.currency}
        </Text>
      )}
    </View>
  ) : null;

  return (
    <View style={[styles.row, style]}>
      {privacy ? (
        <PrivateAmount maskVariant={tokens.integer} toggleOnPress={toggleOnPress}>
          {digits}
        </PrivateAmount>
      ) : (
        digits
      )}
      {currency}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
