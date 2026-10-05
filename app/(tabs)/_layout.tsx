import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GlassTabBar } from '@/ui';

/**
 * тонкий файл маршрута: только раскладка и подписи. вся визуальная часть
 * живёт в `src/ui/GlassTabBar.tsx`, чтобы её можно было переиспользовать
 * и тестировать независимо.
 */
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="crypto" options={{ title: t('tabs.crypto') }} />
      <Tabs.Screen name="cards" options={{ title: t('tabs.cards') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.account') }} />
    </Tabs>
  );
}
