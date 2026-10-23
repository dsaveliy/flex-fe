import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';

import { type Theme, type ThemeName, themes } from './tokens';

type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  canSwitchTheme: boolean;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  /** принудительная тема, полезна для тестов и демонстрации дизайна */
  initialTheme?: ThemeName;
};

/**
 * тема приложения; по умолчанию тёмная. выбранная тема передаётся и в
 * систему через `Appearance.setColorScheme`, чтобы нативные элементы —
 * таб-бар, хедеры, свитчи, статус-бар, Liquid Glass — были в том же режиме.
 */
export function ThemeProvider({ children, initialTheme = 'dark' }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    // на web метода может не быть
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(themeName);
    }
    // web: панель браузера и строка состояния на экране «Домой» — в цвет темы
    if (Platform.OS === 'web') {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', themes[themeName].colors.backgroundTop);
    }
  }, [themeName]);

  const handleSetThemeName = useCallback((name: ThemeName) => {
    setThemeName(name);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[themeName],
      themeName,
      canSwitchTheme: true,
      setThemeName: handleSetThemeName,
    }),
    [handleSetThemeName, themeName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used inside <ThemeProvider>.');
  }
  return context;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

/**
 * создаёт мемоизированные стили, зависящие от темы.
 *
 * const useStyles = makeStyles((t) => ({ box: { padding: t.spacing.lg } }));
 */
export function makeStyles<T extends Record<string, object>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => factory(theme), [theme]);
  };
}
