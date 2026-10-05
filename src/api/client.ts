import type { ApiErrorShape } from './types';

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number;
  readonly code: string;

  constructor({ status, code, message }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export type ApiTransport = {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
};

/**
 * HTTP transport for the future FastAPI backend.
 * Not used while `USE_MOCK_API` is true, but kept here so switching to the
 * real backend is a one-line change in `src/api/config.ts`.
 */
export function createHttpTransport(baseUrl: string): ApiTransport {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        code: 'http_error',
        message: `Request failed: ${response.status} ${response.statusText}`,
      });
    }

    return (await response.json()) as T;
  }

  return {
    get: (path, init) => request(path, { ...init, method: 'GET' }),
    post: (path, body, init) =>
      request(path, { ...init, method: 'POST', body: JSON.stringify(body ?? {}) }),
  };
}
