import { createHttpLogTransport } from '../transport';
import type { LogBatch } from '../types';

const batch: LogBatch = {
  sessionId: 'session-1234',
  platform: 'ios',
  entries: [{ ts: '2026-11-24T10:00:00.000Z', level: 'info', source: 'app', message: 'hi' }],
};

function response(status: number, headers: Record<string, string> = {}) {
  return { ok: status >= 200 && status < 300, status, headers: new Headers(headers) } as Response;
}

describe('createHttpLogTransport', () => {
  it('POST на /client-logs с JSON и access-токеном', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response(202));
    const send = createHttpLogTransport({ baseUrl: 'https://flex.test/api/v1', getToken: () => 'tok', fetchImpl });

    await expect(send(batch)).resolves.toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://flex.test/api/v1/client-logs');
    expect(init).toMatchObject({
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
    });
    expect(JSON.parse(init.body)).toEqual(batch);
  });

  it('без входа заголовка Authorization нет', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response(202));
    await createHttpLogTransport({ baseUrl: '/api/v1', getToken: () => null, fetchImpl })(batch);
    expect(fetchImpl.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('429 → повтор позже, срок из Retry-After', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response(429, { 'Retry-After': '12' }));
    const send = createHttpLogTransport({ baseUrl: '', getToken: () => null, fetchImpl });
    await expect(send(batch)).resolves.toEqual({ ok: false, retryAfterMs: 12_000 });
  });

  it('500 и сбой сети → повтор, 422 → пачка отброшена (её не примут никогда)', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response(500))
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(response(422));
    const send = createHttpLogTransport({ baseUrl: '', getToken: () => null, fetchImpl });
    await expect(send(batch)).resolves.toEqual({ ok: false, retryAfterMs: undefined });
    await expect(send(batch)).resolves.toEqual({ ok: false });
    await expect(send(batch)).resolves.toEqual({ ok: true });
  });
});
