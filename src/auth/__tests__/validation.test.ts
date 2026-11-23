import {
  isValidEmail,
  isValidPhone,
  isValidPin,
  normalizeIdentifier,
  normalizePhone,
  validateRegistration,
} from '../validation';

describe('валидация полей входа и регистрации', () => {
  it.each([
    ['+375 (29) 111-22-33', '+375291112233'],
    ['375291112233', '+375291112233'],
    ['', ''],
  ])('normalizePhone(%p) → %p', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('белорусский номер: +375 и 9 цифр', () => {
    expect(isValidPhone('+375 29 111 22 33')).toBe(true);
    expect(isValidPhone('+37529111223')).toBe(false);
    expect(isValidPhone('+7 999 111 22 33')).toBe(false);
  });

  it('email приводится к нижнему регистру и проверяется', () => {
    expect(isValidEmail('  Basic@Flex.BY ')).toBe(true);
    expect(isValidEmail('basic@flex')).toBe(false);
    expect(normalizeIdentifier(' Basic@Flex.by')).toBe('basic@flex.by');
    expect(normalizeIdentifier('+375 29 111-22-33')).toBe('+375291112233');
  });

  it('PIN — ровно 6 цифр', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('12345a')).toBe(false);
  });

  it('форма регистрации возвращает ключи i18n для каждого неверного поля', () => {
    expect(
      validateRegistration({ phone: '123', email: 'x', password: 'short', confirm: 'other' }),
    ).toEqual({
      phone: 'auth.errors.phoneFormat',
      email: 'auth.errors.emailFormat',
      password: 'auth.errors.passwordShort',
      confirm: 'auth.errors.passwordMismatch',
    });
    expect(
      validateRegistration({
        phone: '+375291112233',
        email: 'a@b.by',
        password: 'LongEnough123',
        confirm: 'LongEnough123',
      }),
    ).toEqual({});
  });
});
