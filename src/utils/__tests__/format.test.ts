import {
  formatPercent,
  formatPercentAbs,
  formatShortDateWithYear,
  greetingSlotFor,
  maskCardNumber,
  trendOf,
} from '../format';

describe('форматирование', () => {
  it('процент со знаком и без', () => {
    expect(formatPercent(2.4, { locale: 'en-US' })).toBe('+2.40%');
    expect(formatPercent(-0.87, { locale: 'en-US' })).toBe('-0.87%');
    expect(formatPercent(0, { locale: 'en-US' })).toBe('0.00%');
    expect(formatPercentAbs(-1.5)).toMatch(/^1[.,]50%$/);
  });

  it('направление тренда', () => {
    expect([trendOf(3), trendOf(-1), trendOf(0)]).toEqual(['up', 'down', 'flat']);
  });

  it('дата с годом без хвоста « г.» в русской локали', () => {
    expect(formatShortDateWithYear('2024-03-08T12:00:00Z', 'ru-RU')).not.toMatch(/г\.?$/);
    expect(formatShortDateWithYear('2024-03-08T12:00:00Z', 'en-US')).toBe('Mar 8, 2024');
  });

  it.each([
    [7, 'morning'],
    [13, 'afternoon'],
    [20, 'evening'],
    [2, 'night'],
  ])('приветствие в %p ч — %p', (hour, slot) => {
    expect(greetingSlotFor(new Date(2026, 10, 24, hour))).toBe(slot);
  });

  it('маска карты', () => {
    expect(maskCardNumber('4821')).toBe('•••• 4821');
  });
});
