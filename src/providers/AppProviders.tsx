import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/api';
import { ThemeProvider } from '@/theme';

import '@/i18n';

/**
 * единое место, где собираются все провайдеры приложения, чтобы файлы
 * маршрутов оставались тонкими, а новые провайдеры (auth, notifications)
 * легко добавлялись.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useRef(createQueryClient()).current;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
