import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { fonts, useTheme } from '@/theme';

/**
 * три вкладки; профиль открывается с аватара в шапке (`app/account.tsx`).
 * системный таб-бар: на iOS 26 это настоящий Liquid Glass `UITabBar`
 * (зажатие и перетаскивание выделения, линза, сворачивание при скролле),
 * на Android — Material 3. для web используется `_layout.web.tsx` со
 * своим `GlassTabBar`.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <NativeTabs
      tintColor={theme.colors.accent}
      minimizeBehavior="onScrollDown"
      labelStyle={{ fontFamily: fonts.medium }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="crypto">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bitcoinsign.circle', selected: 'bitcoinsign.circle.fill' }}
          md="currency_bitcoin"
        />
        <NativeTabs.Trigger.Label>{t('tabs.crypto')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cards">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
          md="credit_card"
        />
        <NativeTabs.Trigger.Label>{t('tabs.cards')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
