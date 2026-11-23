import type { LogBatch, LogTransport, SendResult } from './types';

type TransportOptions = {
  baseUrl: string;
  /** access-токен, если вошли: сервер привяжет записи к пользователю */
  getToken: () => string | null;
  fetchImpl?: typeof fetch;
};

/**
 * отправка пачки на `POST {baseUrl}/client-logs`. идёт мимо `api`/`withAuth`:
 * логирование не должно запускать refresh, выход из сессии и логировать само себя.
 * `keepalive` — запрос доживёт, даже если вкладку закрывают
 */
export function createHttpLogTransport({ baseUrl, getToken, fetchImpl }: TransportOptions): LogTransport {
  return async (batch: LogBatch): Promise<SendResult> => {
    const doFetch = fetchImpl ?? fetch;
    const token = getToken();
    try {
      const response = await doFetch(`${baseUrl}/client-logs`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(batch),
      });
      if (response.ok) return { ok: true };
      // 422 — пачку сервер не примет и при повторе: выбрасываем, чтобы не застрять
      if (response.status === 422 || response.status === 413) return { ok: true };
      const retry = Number(response.headers.get('Retry-After'));
      return { ok: false, retryAfterMs: Number.isFinite(retry) && retry > 0 ? retry * 1000 : undefined };
    } catch {
      return { ok: false };
    }
  };
}
