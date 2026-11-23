import { ApiError, createHttpTransport } from '../client';

// логгер подменяется: проверяем, что транспорт пишет нужный уровень и не пишет секреты
const mockLog = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('@/logging', () => ({
  // логгер создаётся при импорте client.ts — методы достаём лениво
  logger: {
    child: () => ({
      debug: (...a: unknown[]) => mockLog.debug(...a),
      info: (...a: unknown[]) => mockLog.info(...a),
      warn: (...a: unknown[]) => mockLog.warn(...a),
      error: (...a: unknown[]) => mockLog.error(...a),
    }),
  },
  safePath: (url: string) => url.split('?')[0],
}));
jest.mock('@/auth/session', () => ({ getAccessToken: () => 'access-token' }));
jest.mock('@/auth/cryptoSession', () => ({ getCryptoToken: () => null }));

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'X',
    headers: new Headers(headers),
    json: async () => body,
  } as Response;
}

describe('createHttpTransport', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('успех: Bearer-токен, JSON-тело и debug-запись с длительностью', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'u1' }));
    const http = createHttpTransport('https://flex.test/api/v1');

    await expect(http.post('/transfers', { amountMinor: 100 })).resolves.toEqual({ id: 'u1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://flex.test/api/v1/transfers');
    expect(init.headers.Authorization).toBe('Bearer access-token');
    expect(JSON.parse(init.body)).toEqual({ amountMinor: 100 });
    expect(mockLog.debug).toHaveBeenCalledWith(
      'POST /transfers 200',
      expect.objectContaining({ method: 'POST', status: 200, ms: expect.any(Number) }),
    );
  });

  it('4xx: ApiError с кодом сервера, попытками и Retry-After; в лог — warn без тела запроса', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(429, { code: 'TOO_MANY_ATTEMPTS', message: 'Wait', attempts_left: 0 }, { 'Retry-After': '90' }),
    );
    const http = createHttpTransport('');

    const error = await http.post('/auth/login?debug=1', { password: 'Secret123!' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, code: 'TOO_MANY_ATTEMPTS', attemptsLeft: 0, retryAfter: 90 });
    expect(mockLog.warn).toHaveBeenCalledWith(
      'POST /auth/login 429 TOO_MANY_ATTEMPTS',
      expect.objectContaining({ path: '/auth/login', code: 'TOO_MANY_ATTEMPTS' }),
    );
    expect(JSON.stringify(mockLog.warn.mock.calls)).not.toContain('Secret123!');
  });

  it('ошибка в поле detail (FastAPI) тоже разбирается', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { detail: { code: 'FORBIDDEN', message: 'Admin only' } }));
    await expect(createHttpTransport('').get('/admin/users')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Admin only',
    });
  });

  it('5xx — error, сбой сети — error и исключение дальше', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(502, 'Bad gateway'));
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const http = createHttpTransport('');

    await expect(http.get('/me')).rejects.toMatchObject({ status: 502, code: 'http_error' });
    expect(mockLog.error).toHaveBeenCalledWith('GET /me 502', undefined, expect.objectContaining({ status: 502 }));

    await expect(http.get('/me')).rejects.toThrow('Network request failed');
    expect(mockLog.error).toHaveBeenLastCalledWith(
      'GET /me network error',
      expect.any(TypeError),
      expect.objectContaining({ path: '/me' }),
    );
  });

  it('204 → undefined', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204, null));
    await expect(createHttpTransport('').delete('/cards/1')).resolves.toBeUndefined();
  });
});
