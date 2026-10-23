import { Stack } from 'expo-router';

import { palette } from '@/theme';

export const unstable_settings = { initialRouteName: 'login' };

/** экраны до входа; доступны, только пока сессии нет (`Stack.Protected` в корне) */
export default function AuthLayout() {
  const backHeader = {
    headerShown: true,
    headerTransparent: true,
    headerTitle: '',
    headerBackButtonDisplayMode: 'minimal' as const,
    headerTintColor: palette.accent,
  };

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" options={backHeader} />
      <Stack.Screen name="verify" options={backHeader} />
    </Stack>
  );
}
