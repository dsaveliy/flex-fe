import { getCryptoToken } from '@/auth/cryptoSession';
import { getAccessToken } from '@/auth/session';
import { logger, safePath } from '@/logging';

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
/** файл (вложение чата) уходит как multipart: границу в Content-Type ставит сам fetch */
const isForm = (body: unknown): body is FormData =>
  typeof FormData !== 'undefined' && body instanceof FormData;

const log = logger.child('api');

/**
 * каждый запрос — запись в лог: успех — debug с длительностью, 4xx — warn с кодом ошибки,
 * 5xx и сбой сети — error. тело и заголовки не пишем: там деньги, пароли и токены
 */
function logResponse(method: string, path: string, startedAt: number, result: Response | ApiError) {
  const fields = { method, path: safePath(path), ms: Date.now() - startedAt };
  if (result instanceof ApiError) {
    const context = { ...fields, status: result.status, code: result.code };
    if (result.status >= 500) log.error(`${method} ${fields.path} ${result.status}`, undefined, context);
    else log.warn(`${method} ${fields.path} ${result.status} ${result.code}`, context);
  } else {
    log.debug(`${method} ${fields.path} ${result.status}`, { ...fields, status: result.status });
  }
}

export function createHttpTransport(baseUrl: string): ApiTransport {
  async function request<T>(path: string, init: RequestInit, auth: AuthScope): Promise<T> {
    const method = init.method ?? 'GET';
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        // web: refresh в httpOnly-cookie
        credentials: auth === 'refresh' ? 'include' : init.credentials,
        headers: {
          ...(isForm(init.body) ? {} : { 'Content-Type': 'application/json' }),
          ...bearer(auth),
          ...(init.headers ?? {}),
        },
      });
    } catch (error) {
      log.error(`${method} ${safePath(path)} network error`, error, {
        method,
        path: safePath(path),
        ms: Date.now() - startedAt,
      });
      throw error;
    }

    if (!response.ok) {
      const error = await toApiError(response);
      logResponse(method, path, startedAt, error);
      throw error;
    }
    logResponse(method, path, startedAt, response);
    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  }

  return {
    get: (path, options) =>
      request(path, { ...options?.init, method: 'GET' }, options?.auth ?? 'access'),
    post: (path, body, options) =>
      request(
        path,
        { ...options?.init, method: 'POST', body: isForm(body) ? body : JSON.stringify(body ?? {}) },
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
