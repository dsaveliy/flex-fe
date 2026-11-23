import { parseAmount, sanitizeAmount } from '../amount';

describe('ввод суммы', () => {
  it.each([
    ['12,5', 2, 1250],
    ['12.50', 2, 1250],
    ['1 000', 2, 100000],
    ['0,001', 8, 100000],
    ['7', 0, 7],
    ['0,019', 2, 1],
  ])('parseAmount(%p, %p) = %p минорных единиц', (text, digits, expected) => {
    expect(parseAmount(text, digits)).toBe(expected);
  });

  it.each(['', '0', '0,00', 'abc', '1,2,3', '-5'])('parseAmount(%p) → null', (text) => {
    expect(parseAmount(text, 2)).toBeNull();
  });

  it('sanitizeAmount оставляет цифры и одну запятую, не больше знаков валюты', () => {
    expect(sanitizeAmount('12a.345', 2)).toBe('12,34');
    expect(sanitizeAmount('1,2,3', 2)).toBe('1,23');
    expect(sanitizeAmount('15,7', 0)).toBe('15');
    expect(sanitizeAmount('100', 2)).toBe('100');
  });
});
