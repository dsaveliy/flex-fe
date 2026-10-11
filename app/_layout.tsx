import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { darkTheme, palette } from '@/theme';

// Глобальные веб-стили (SASS/SCSS). Expo Router требует импортировать
// глобальный CSS именно в корневом layout; на native-платформах этот
// импорт автоматически игнорируется бандлером.
import '@/styles/global.scss';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: darkTheme.colors.backgroundTop }} />;
  }

  return (
    <AppProviders>
      {/* «auto» следует за темой, выставленной через Appearance в ThemeProvider */}
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
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
        {/* галерея виджетов Crypto: на iOS 26 шторка получает системный фон Liquid Glass */}
        <Stack.Screen
          name="widget-gallery"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.8, 1],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </AppProviders>
  );
}