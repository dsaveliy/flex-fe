import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';

import { cryptoProtectedKeys } from '@/api';
import { cryptoStore } from '@/auth/cryptoSession';
import { sessionStore } from '@/auth/session';
import { bootstrapSession } from '@/auth/sessionActions';

/**
 * запускает сессию (refresh из Keychain) и чистит кэш React Query:
 * выход — весь кэш, закрытие криптораздела — данные кошелька
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    void bootstrapSession();
  }, []);

  useEffect(() => {
    let status = sessionStore.get().status;
    const offSession = sessionStore.subscribe(() => {
      const next = sessionStore.get().status;
      if (status === 'signedIn' && next === 'signedOut') queryClient.clear();
      status = next;
    });

    let unlocked = Boolean(cryptoStore.get().token);
    const offCrypto = cryptoStore.subscribe(() => {
      const next = Boolean(cryptoStore.get().token);
      if (unlocked && !next) {
        for (const queryKey of cryptoProtectedKeys) queryClient.removeQueries({ queryKey });
      }
      unlocked = next;
    });

    return () => {
      offSession();
      offCrypto();
    };
  }, [queryClient]);

  return children;
}
