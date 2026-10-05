import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/api';
import { ThemeProvider } from '@/theme';

import '@/i18n';

/**
 * Single place where all app-wide providers are composed, so route files
 * stay thin and new providers (auth, notifications) are easy to add.
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
