import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type BalancePrivacyValue = {
  /** суммы на экранах скрыты точками */
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  toggle: () => void;
};

const BalancePrivacyContext = createContext<BalancePrivacyValue | null>(null);

/**
 * режим «скрыть баланс»: один переключатель на всё приложение. живёт в памяти,
 * сохранение между запусками появится вместе с хранилищем настроек.
 */
export function BalancePrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const toggle = useCallback(() => setHidden((value) => !value), []);

  const value = useMemo(() => ({ hidden, setHidden, toggle }), [hidden, toggle]);

  return <BalancePrivacyContext.Provider value={value}>{children}</BalancePrivacyContext.Provider>;
}

export function useBalancePrivacy(): BalancePrivacyValue {
  const context = useContext(BalancePrivacyContext);
  if (!context) {
    throw new Error('useBalancePrivacy должен использоваться внутри BalancePrivacyProvider');
  }
  return context;
}
