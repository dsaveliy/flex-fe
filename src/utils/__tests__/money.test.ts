import { formatMoney, formatPrice, money, splitMoneyParts, toMajorUnits } from '../money';

describe('деньги в минорных единицах', () => {
  it('toMajorUnits учитывает число знаков валюты', () => {
    expect(toMajorUnits(money(124900, 'BYN'))).toBe(1249);
    expect(toMajorUnits(money(150000000, 'BTC'), 8)).toBe(1.5);
  });

  it('formatMoney: разделители локали, знак и код валюты', () => {
    expect(formatMoney(money(124900, 'BYN'), { locale: 'en-US' })).toBe('1,249.00 BYN');
    expect(formatMoney(money(285000, 'USD'), { locale: 'en-US', signDisplay: 'always' })).toBe('+2,850.00 USD');
    expect(formatMoney(money(5, 'BYN'), { locale: 'en-US', withCurrency: false })).toBe('0.05');
  });

  it('splitMoneyParts делит на целую и дробную части для крупного баланса', () => {
    expect(splitMoneyParts(money(-124905, 'BYN'), { locale: 'en-US' })).toEqual({
      integer: '-1,249',
      fraction: '05',
      currency: 'BYN',
    });
  });

  it('formatPrice: знаков после запятой тем меньше, чем крупнее цена', () => {
    expect(formatPrice(97250.4, { locale: 'en-US' })).toBe('$97,250');
    expect(formatPrice(3.5, { locale: 'en-US' })).toBe('$3.50');
    expect(formatPrice(0.12345, { locale: 'en-US' })).toBe('$0.1235');
  });
});
