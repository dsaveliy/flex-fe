/** правила полей; одни и те же на клиенте и в mock-сервере (сервер всё равно проверяет сам) */

export const PASSWORD_MIN_LENGTH = 12;
export const PIN_LENGTH = 6;

/** `+375 (29) 111-22-33` → `+375291112233` */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** белорусский номер: +375 и 9 цифр */
export function isValidPhone(input: string): boolean {
  return /^\+375\d{9}$/.test(normalizePhone(input));
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(input));
}

/** логин — телефон или email */
export function normalizeIdentifier(input: string): string {
  return input.includes('@') ? normalizeEmail(input) : normalizePhone(input);
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export type RegisterField = 'phone' | 'email' | 'password' | 'confirm';
export type RegisterErrors = Partial<Record<RegisterField, string>>;

/** ошибки формы регистрации — ключи i18n */
export function validateRegistration(values: Record<RegisterField, string>): RegisterErrors {
  const errors: RegisterErrors = {};
  if (!isValidPhone(values.phone)) errors.phone = 'auth.errors.phoneFormat';
  if (!isValidEmail(values.email)) errors.email = 'auth.errors.emailFormat';
  if (values.password.length < PASSWORD_MIN_LENGTH) errors.password = 'auth.errors.passwordShort';
  if (values.confirm !== values.password) errors.confirm = 'auth.errors.passwordMismatch';
  return errors;
}
