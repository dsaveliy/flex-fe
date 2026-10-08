import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

import type { DisplayCurrency } from '@/api';
import { DISPLAY_CURRENCIES, useDisplayCurrency } from '@/providers/DisplayCurrencyProvider';

import { CurrencyMenuLabel, type CurrencyMenuProps } from './CurrencyMenuLabel';
import { Touchable } from './Pressable';

export type { CurrencyMenuProps } from './CurrencyMenuLabel';

/**
 * выбор валюты отображения баланса. Android — системный диалог, web — тап
 * переключает валюты по кругу. на iOS — `CurrencyMenu.ios.tsx` с нативным меню.
 */
export function CurrencyMenu(props: CurrencyMenuProps) {
  const { t } = useTranslation();
  const { currency, setCurrency } = useDisplayCurrency();

  const choose = (next: DisplayCurrency) => {
    void Haptics.selectionAsync();
    setCurrency(next);
  };

  const handlePress = () => {
    if (Platform.OS === 'web') {
      const index = DISPLAY_CURRENCIES.indexOf(currency);
      choose(DISPLAY_CURRENCIES[(index + 1) % DISPLAY_CURRENCIES.length]);
      return;
    }
    Alert.alert(t('home.currencyMenuTitle'), undefined, [
      ...DISPLAY_CURRENCIES.map((code) => ({
        text: `${code === currency ? '✓ ' : ''}${code} · ${t(`currencies.${code}`)}`,
        onPress: () => choose(code),
      })),
      { text: t('home.actions.cancel'), style: 'cancel' as const },
    ]);
  };

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={t('a11y.changeCurrency')}
      accessibilityValue={{ text: currency }}
      hitSlop={10}
      haptic={false}
      onPress={handlePress}
    >
      <CurrencyMenuLabel {...props} />
    </Touchable>
  );
}
