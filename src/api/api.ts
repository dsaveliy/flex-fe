import { withAuth } from './authInterceptor';
import { baseApi } from './services';

/** API для экранов и хуков: токены, обновление и реакция на отзыв — внутри */
export const api = withAuth(baseApi);
