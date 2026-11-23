import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import '@/i18n';
import { ThemeProvider } from '@/theme';

function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

/** компонент в окружении приложения: тема и i18n (русский — см. jest.setup.js); rerender сохраняет обёртку */
export function renderWithTheme(ui: ReactElement) {
  return render(ui, { wrapper: Providers });
}
