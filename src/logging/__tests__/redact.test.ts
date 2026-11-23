import { REDACTED, redact, safePath } from '../redact';

describe('redact', () => {
  it('скрывает пароли, токены, PIN и данные карты на любой глубине', () => {
    expect(
      redact({
        identifier: 'basic@flex.by',
        password: 'Secret123!',
        nested: { accessToken: 'eyJ…', cryptoPin: '123456', card: { cvv: '123', last4: '4821' } },
      }),
    ).toEqual({
      identifier: 'basic@flex.by',
      password: REDACTED,
      nested: { accessToken: REDACTED, cryptoPin: REDACTED, card: { cvv: REDACTED, last4: '4821' } },
    });
  });

  it('код ошибки сервера и похожие на секреты обычные поля остаются', () => {
    expect(
      redact({ code: 'RECIPIENT_NOT_FOUND', company: 'Flex', spinner: true, verificationCode: '000000', cardPan: '4111' }),
    ).toEqual({ code: 'RECIPIENT_NOT_FOUND', company: 'Flex', spinner: true, verificationCode: REDACTED, cardPan: REDACTED });
  });

  it('обрезает длинные строки и массивы, переживает циклы', () => {
    const loop: Record<string, unknown> = { name: 'loop' };
    loop.self = loop;
    const result = redact({ long: 'x'.repeat(600), list: Array.from({ length: 30 }, (_, i) => i), loop });
    expect((result?.long as string).length).toBe(501);
    expect(result?.list).toHaveLength(20);
    expect((result?.loop as Record<string, unknown>).self).toBe('[circular]');
  });

  it('Error превращается в имя и сообщение, функции выбрасываются', () => {
    expect(redact({ err: new TypeError('boom'), fn: () => 1 })).toEqual({
      err: { name: 'TypeError', message: 'boom' },
      fn: undefined,
    });
  });

  it('пустой контекст не отправляется', () => {
    expect(redact(undefined)).toBeUndefined();
    expect(redact({})).toBeUndefined();
  });

  it('safePath убирает query', () => {
    expect(safePath('/auth/verify?code=000000')).toBe('/auth/verify');
    expect(safePath('/me')).toBe('/me');
  });
});
