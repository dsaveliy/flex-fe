import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';

import { api, ApiError, queryKeys } from '@/api';
import type { CryptoAccessStatus, VerificationChannel } from '@/api/types';

import {
  clearBiometricCredential,
  getBiometryKind,
  hasBiometricCredential,
  readBiometricCredential,
  saveBiometricCredential,
} from './biometrics';
import { cryptoStore, setCryptoSession } from './cryptoSession';
import { getDeviceId } from './deviceId';
import { sessionStore } from './session';
import { lockCrypto, refreshSession, signInWithPassword, signOut } from './sessionActions';

/** сессия Уровня 1: статус, роль из payload access, причина выхода */
export function useSession() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
}

/** криптосессия Уровня 2: открыта ли, когда закроется */
export function useCryptoSession() {
  return useSyncExternalStore(cryptoStore.subscribe, cryptoStore.get);
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) =>
      signInWithPassword(identifier, password),
  });
}

export function useLogout() {
  return useMutation({ mutationFn: signOut });
}

export function useRegister() {
  return useMutation({ mutationFn: api.register });
}

export function useVerifyContact() {
  return useMutation({ mutationFn: api.verifyContact });
}

export function useResendCode() {
  return useMutation({
    mutationFn: (body: { verificationId: string; channel: VerificationChannel }) =>
      api.resendCode(body),
  });
}

/** доступ к Crypto. пока KYC на проверке — опрашиваем статус */
export function useCryptoAccess() {
  return useQuery<CryptoAccessStatus>({
    queryKey: queryKeys.cryptoAccess,
    queryFn: async () => {
      const status = await api.getCryptoAccess({ deviceId: await getDeviceId() });
      // Face ID включён на сервере, но секрета на устройстве нет (переустановка) — считаем выключенным
      return {
        ...status,
        biometricEnabled: status.biometricEnabled && (await hasBiometricCredential()),
      };
    },
    refetchInterval: (query) => (query.state.data?.kycStatus === 'pending' ? 2_000 : false),
    staleTime: 0,
  });
}

/**
 * роль в access устарела (KYC одобрен после входа) — обновляем пару, чтобы
 * новый токен нёс `role: pro`
 */
export function useRoleSync(status: CryptoAccessStatus | undefined) {
  const queryClient = useQueryClient();
  const role = useSession().claims?.role;
  const serverRole = status?.role;
  useEffect(() => {
    if (serverRole && role && serverRole !== role) {
      void refreshSession().catch(() => undefined);
      // после одобрения KYC сервер открыл криптокошельки — список счетов устарел
      void queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    }
  }, [serverRole, role, queryClient]);
}

export function useBiometryKind() {
  return useQuery({
    queryKey: ['device', 'biometry'],
    queryFn: getBiometryKind,
    staleTime: Infinity,
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.submitKyc(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cryptoAccess }),
  });
}

/** ошибка без запроса к серверу: пользователь закрыл системный запрос Face ID */
export const BIOMETRIC_CANCELLED = 'BIOMETRIC_CANCELLED';

export type UnlockFactor = { type: 'pin'; pin: string } | { type: 'biometric'; prompt: string };

/** вход в криптораздел вторым фактором → crypto-токен в памяти */
export function useCryptoLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (factor: UnlockFactor) => {
      const deviceId = await getDeviceId();
      if (factor.type === 'pin') {
        setCryptoSession(await api.cryptoLogin({ factor, deviceId }));
        return;
      }
      const credential = await readBiometricCredential(factor.prompt);
      if (!credential) {
        throw new ApiError({ status: 0, code: BIOMETRIC_CANCELLED, message: 'cancelled' });
      }
      setCryptoSession(
        await api.cryptoLogin({ factor: { type: 'biometric', credential }, deviceId }),
      );
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code !== BIOMETRIC_CANCELLED) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cryptoAccess });
      }
    },
  });
}

/**
 * первый заход: задать PIN и сразу войти им же. сессия возвращается, а не
 * открывается: экран сначала предлагает Face ID, затем `openCryptoSession`
 */
export function useCryptoSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pin: string) => {
      const deviceId = await getDeviceId();
      await api.cryptoSetup({ pin, deviceId });
      return api.cryptoLogin({ factor: { type: 'pin', pin }, deviceId });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.cryptoAccess }),
  });
}

/** включить или выключить Face ID; требует открытого раздела (crypto-токен) */
export function useSetBiometric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { credential } = await api.setCryptoBiometric({
        enabled,
        deviceId: await getDeviceId(),
      });
      if (credential) await saveBiometricCredential(credential);
      else await clearBiometricCredential();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.cryptoAccess }),
  });
}

export { setCryptoSession as openCryptoSession };

export function useLockCrypto() {
  return useMutation({ mutationFn: lockCrypto });
}
