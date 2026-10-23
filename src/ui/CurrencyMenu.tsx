import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DisplayCurrency } from '@/api';
import { DISPLAY_CURRENCIES, useDisplayCurrency } from '@/providers/DisplayCurrencyProvider';

import { CurrencyMenuLabel, type CurrencyMenuProps } from './CurrencyMenuLabel';
import { MenuSheet } from './MenuSheet';
import { Touchable } from './Pressable';

export type { CurrencyMenuProps } from './CurrencyMenuLabel';

/**
 * выбор валюты отображения баланса. web и Android — шторка со списком,
 * на iOS — `CurrencyMenu.ios.tsx` с нативным меню.
 */
export function CurrencyMenu(props: CurrencyMenuProps) {
  const { t } = useTranslation();
  const { currency, setCurrency } = useDisplayCurrency();

  const choose = (next: DisplayCurrency) => {
    void Haptics.selectionAsync();
    setCurrency(next);
  };

  const [open, setOpen] = useState(false);

  return (
    <>
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.changeCurrency')}
        accessibilityValue={{ text: currency }}
        hitSlop={10}
        haptic={false}
        onPress={() => setOpen(true)}
      >
        <CurrencyMenuLabel {...props} />
      </Touchable>
      <MenuSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={t('home.currencyMenuTitle')}
        cancelLabel={t('home.actions.cancel')}
        items={DISPLAY_CURRENCIES.map((code) => ({
          id: code,
          label: `${code} · ${t(`currencies.${code}`)}`,
          checked: code === currency,
          onPress: () => choose(code),
        }))}
      />
    </>
  );
}
