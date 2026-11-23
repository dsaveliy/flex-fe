import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { logger } from '@/logging';

const log = logger.child('query');

export function createQueryClient(): QueryClient {
  return new QueryClient({
    // HTTP-ошибки уже записаны транспортом; здесь — какой экранный запрос не получил данные
    queryCache: new QueryCache({
      onError: (error, query) =>
        log.warn('query failed', { key: query.queryKey.slice(0, 2), error: error.message }),
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) =>
        log.warn('mutation failed', {
          key: mutation.options.mutationKey?.slice(0, 2),
          error: error.message,
        }),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
