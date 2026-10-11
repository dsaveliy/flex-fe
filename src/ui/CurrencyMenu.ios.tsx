import { Host, Menu, Picker, RNHostView, Text } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { DisplayCurrency } from '@/api';
import { DISPLAY_CURRENCIES, useDisplayCurrency } from '@/providers/DisplayCurrencyProvider';
import { useTheme } from '@/theme';

import { CurrencyMenuLabel, type CurrencyMenuProps } from './CurrencyMenuLabel';

export type { CurrencyMenuProps } from './CurrencyMenuLabel';

/**
 * iOS: «BYN ▾» — кнопка нативного SwiftUI-меню Liquid Glass. внутри
 * `Picker`, поэтому у текущей валюты системная галочка. подпись — обычный
 * RN-текст, встроенный через `RNHostView`, чтобы совпасть по шрифту с суммой.
 */
export function CurrencyMenu(props: CurrencyMenuProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currency, setCurrency } = useDisplayCurrency();

  return (
    <Host matchContents ignoreSafeArea="all" colorScheme={theme.isDark ? 'dark' : 'light'}>
      <Menu
        label={
          <RNHostView matchContents>
            {/* касания обрабатывает меню, а не RN-вью внутри */}
            <View pointerEvents="none">
              <CurrencyMenuLabel {...props} />
            </View>
          </RNHostView>
        }
      >
        <Picker<DisplayCurrency>
          label={t('home.currencyMenuTitle')}
          selection={currency}
          onSelectionChange={(next) => {
            void Haptics.selectionAsync();
            setCurrency(next);
          }}
        >
          {DISPLAY_CURRENCIES.map((code) => (
            <Text key={code} modifiers={[tag(code)]}>
              {`${code} · ${t(`currencies.${code}`)}`}
            </Text>
          ))}
        </Picker>
      </Menu>
    </Host>
  );
}
