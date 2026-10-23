import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { useSession } from '@/auth';
import { AppProviders } from '@/providers/AppProviders';
import { darkTheme, palette } from '@/theme';
import { useAppFonts } from '@/theme/useAppFonts';

// Глобальные веб-стили (SASS/SCSS). Expo Router требует импортировать
// глобальный CSS именно в корневом layout; на native-платформах этот
// импорт автоматически игнорируется бандлером.
import '@/styles/global.scss';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: darkTheme.colors.backgroundTop }} />;
  }

  return (
    <AppProviders>
      {/* «auto» следует за темой, выставленной через Appearance в ThemeProvider */}
      <StatusBar style="auto" />
      <RootStack />
    </AppProviders>
  );
}

const OPERATION_SHEETS = [
  'transfer',
  'top-up',
  'link-card',
  'withdraw',
  'pay',
  'exchange',
  'earn-subscribe',
] as const;

const OPERATION_SHEET_OPTIONS = {
  presentation: 'formSheet' as const,
  // во всю высоту: внизу формы кнопка, а над ней поднимается клавиатура
  sheetAllowedDetents: [1],
  sheetGrabberVisible: true,
};

/**
 * маршруты по состоянию сессии: без входа доступна только группа `(auth)`,
 * после входа — приложение. переходы между ними делает сам `Stack.Protected`
 */
function RootStack() {
  const { status } = useSession();

  // пока refresh из Keychain обменивается на новую пару — пустой фон, как при загрузке шрифтов
  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: darkTheme.colors.backgroundTop }} />;
  }

  const signedIn = status === 'signedIn';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="account"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: palette.accent,
          }}
        />
        {/* шторки денежных операций: перевод, пополнение, обмен, оплата, Earn */}
        {OPERATION_SHEETS.map((name) => (
          <Stack.Screen key={name} name={name} options={OPERATION_SHEET_OPTIONS} />
        ))}
        {/* галерея виджетов Crypto: на iOS 26 шторка получает системный фон Liquid Glass */}
        <Stack.Screen
          name="widget-gallery"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.8, 1],
            sheetGrabberVisible: true,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
