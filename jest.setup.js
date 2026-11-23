// тесты не ходят в сеть и не пишут в консоль: логгер в тестах без транспорта
process.env.EXPO_PUBLIC_API_URL = '';
// i18n на русском, чтобы проверять реальные строки интерфейса
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'ru', languageTag: 'ru-RU' }],
  getCalendars: () => [{ timeZone: 'Europe/Minsk' }],
}));
// анимации и worklets без нативного модуля
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
