import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGUAGES = ['en', 'ru'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: AppLanguage = 'en';

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const;

function resolveDeviceLanguage(): AppLanguage {
  const locales = Localization.getLocales();
  const deviceCode = locales[0]?.languageCode ?? FALLBACK_LANGUAGE;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceCode)
    ? (deviceCode as AppLanguage)
    : FALLBACK_LANGUAGE;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: resolveDeviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: 'translation',
    returnNull: false,
    interpolation: { escapeValue: false },
  });
}

/** язык, активный в i18next, приведённый к поддерживаемому коду */
export function getCurrentLanguage(): AppLanguage {
  const code = i18n.resolvedLanguage ?? i18n.language ?? FALLBACK_LANGUAGE;
  const short = code.split('-')[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(short)
    ? (short as AppLanguage)
    : FALLBACK_LANGUAGE;
}

export async function changeLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
}

/** локаль BCP-47, используемая форматтерами `Intl` */
export function getIntlLocale(): string {
  return getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US';
}

export default i18n;