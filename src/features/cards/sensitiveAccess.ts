/**
 * доступ к чувствительным данным карты (реквизиты). здесь появится
 * дополнительная проверка — пароль или Face ID; пока доступ выдаётся сразу.
 */
export async function requestSensitiveAccess(): Promise<boolean> {
  return true;
}
