import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { type DisplayCurrency, useRates } from '@/api';
import { type Money, money } from '@/utils/money';

export const DISPLAY_CURRENCIES: DisplayCurrency[] = ['BYN', 'USD', 'EUR', 'BTC'];

/** точность хранения (минорные единицы) и сколько знаков показывать */
const PRECISION: Record<DisplayCurrency, { minorUnitDigits: number; fractionDigits: number }> = {
  BYN: { minorUnitDigits: 2, fractionDigits: 2 },
  USD: { minorUnitDigits: 2, fractionDigits: 2 },
  EUR: { minorUnitDigits: 2, fractionDigits: 2 },
  BTC: { minorUnitDigits: 8, fractionDigits: 4 },
};

type DisplayCurrencyValue = {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyValue | null>(null);

/**
 * валюта отображения общего баланса. одна на всё приложение: меню на Home
 * и пункт в профиле меняют одно и то же значение. живёт в памяти, сохранение
 * появится вместе с хранилищем настроек.
 */
export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>('BYN');
  const setCurrency = useCallback((next: DisplayCurrency) => setCurrencyState(next), []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return (
    <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyValue {
  const context = useContext(DisplayCurrencyContext);
  if (!context) {
    throw new Error('useDisplayCurrency должен использоваться внутри DisplayCurrencyProvider');
  }
  return context;
}

export type DisplayAmount = {
  value: Money;
  minorUnitDigits: number;
  fractionDigits: number;
};

/**
 * пересчёт суммы из базовой валюты (BYN, основные единицы) в валюту
 * отображения. пока курсы не загрузились, суммы показываются в базовой валюте.
 */
export function useDisplayAmount(): (baseAmount: number) => DisplayAmount {
  const { currency } = useDisplayCurrency();
  const rates = useRates();

  return useCallback(
    (baseAmount: number) => {
      const rate = rates.data?.rates[currency];
      const target: DisplayCurrency = rate ? currency : 'BYN';
      const precision = PRECISION[target];
      const major = rate ? baseAmount / rate : baseAmount;
      return {
        value: money(Math.round(major * 10 ** precision.minorUnitDigits), target),
        ...precision,
      };
    },
    [currency, rates.data],
  );
}
