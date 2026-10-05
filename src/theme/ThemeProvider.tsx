import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { type Theme, type ThemeName, themes } from './tokens';

type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  /** тёмная тема существует как заглушка; переключение пока намеренно отключено */
  canSwitchTheme: boolean;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  /** принудительная тема, полезна для тестов и демонстрации дизайна */
  initialTheme?: ThemeName;
};

export function ThemeProvider({ children, initialTheme = 'light' }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);

  const handleSetThemeName = useCallback((name: ThemeName) => {
    setThemeName(name);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[themeName],
      themeName,
      canSwitchTheme: false,
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