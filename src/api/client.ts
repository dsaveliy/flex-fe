import { getCryptoToken } from '@/auth/cryptoSession';
import { getAccessToken } from '@/auth/session';

import type { ApiErrorShape } from './types';

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number;
  readonly code: string;
  readonly attemptsLeft?: number;
  readonly retryAfter?: number;
  readonly details?: Record<string, unknown>;

  constructor({ status, code, message, attemptsLeft, retryAfter, details }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.attemptsLeft = attemptsLeft;
    this.retryAfter = retryAfter;
    this.details = details;
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

/**
 * какой токен нужен запросу:
 * `none` — публичный, `access` — Уровень 1, `crypto` — crypto-api (Уровень 2),
 * `refresh` — эндпоинт обновления (refresh передаётся в теле)
 */
export type AuthScope = 'none' | 'access' | 'crypto' | 'refresh';

export type RequestOptions = { auth?: AuthScope; init?: RequestInit };

export type ApiTransport = {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
};

/** денежная операция: повтор с тем же ключом не проведёт её второй раз (сервер вернёт прежний результат) */
export function idempotent(key: string): RequestInit {
  return { headers: { 'Idempotency-Key': key } };
}

function bearer(scope: AuthScope): Record<string, string> {
  const token =
    scope === 'access' ? getAccessToken() : scope === 'crypto' ? getCryptoToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** ошибка FastAPI: `{code, message, attempts_left, details}` — в корне или в `detail` */
async function toApiError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const json = (await response.json()) as Record<string, unknown>;
    body =
      json.detail && typeof json.detail === 'object'
        ? (json.detail as Record<string, unknown>)
        : json;
  } catch {
    // тело не JSON — остаётся общий код
  }
  const retryHeader = response.headers.get('Retry-After');

  return new ApiError({
    status: response.status,
    code: typeof body.code === 'string' ? body.code : 'http_error',
    message:
      typeof body.message === 'string'
        ? body.message
        : `Request failed: ${response.status} ${response.statusText}`,
    attemptsLeft: typeof body.attempts_left === 'number' ? body.attempts_left : undefined,
    retryAfter: retryHeader ? Number(retryHeader) : undefined,
    details:
      body.details && typeof body.details === 'object'
        ? (body.details as Record<string, unknown>)
        : undefined,
  });
}

/**
 * транспорт HTTP для бэкенда на FastAPI (включается адресом `EXPO_PUBLIC_API_URL`).
 * токен берётся из сессии по `auth`; повтор после refresh и выход при отзыве —
 * в `authInterceptor.ts`, общем для mock и HTTP
 */
export function createHttpTransport(baseUrl: string): ApiTransport {
  async function request<T>(path: string, init: RequestInit, auth: AuthScope): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      // web: refresh в httpOnly-cookie
      credentials: auth === 'refresh' ? 'include' : init.credentials,
      headers: {
        'Content-Type': 'application/json',
        ...bearer(auth),
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  }

  return {
    get: (path, options) =>
      request(path, { ...options?.init, method: 'GET' }, options?.auth ?? 'access'),
    post: (path, body, options) =>
      request(
        path,
        { ...options?.init, method: 'POST', body: JSON.stringify(body ?? {}) },
        options?.auth ?? 'access',
      ),
    put: (path, body, options) =>
      request(
        path,
        { ...options?.init, method: 'PUT', body: JSON.stringify(body ?? {}) },
        options?.auth ?? 'access',
      ),
    patch: (path, body, options) =>
      request(
        path,
        { ...options?.init, method: 'PATCH', body: JSON.stringify(body ?? {}) },
        options?.auth ?? 'access',
      ),
    delete: (path, options) =>
      request(path, { ...options?.init, method: 'DELETE' }, options?.auth ?? 'access'),
  };
}
