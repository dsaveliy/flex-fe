import { StyleSheet, View } from 'react-native';

import { useDisplayCurrency } from '@/providers/DisplayCurrencyProvider';
import { type ThemeColors, type TypographyToken, useTheme } from '@/theme';

import { Icon } from './icons/Icon';
import { Text } from './Text';

export type CurrencyMenuProps = {
  /** типографика подписи, чтобы совпасть с соседней суммой */
  variant?: TypographyToken;
  color?: keyof ThemeColors;
};

/** подпись «BYN ▾» — общая для всех платформ */
export function CurrencyMenuLabel({ variant = 'sectionTitle', color = 'textMuted' }: CurrencyMenuProps) {
  const theme = useTheme();
  const { currency } = useDisplayCurrency();

  return (
    <View style={[styles.label, { gap: 2 }]}>
      <Text variant={variant} color={color}>
        {currency}
      </Text>
      <Icon name="chevronDown" size={14} strokeWidth={2.2} color={theme.colors[color]} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
