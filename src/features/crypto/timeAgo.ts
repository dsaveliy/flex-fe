import type { TFunction } from 'i18next';

/** «12 мин назад», «3 ч назад», «2 д назад» — для ленты новостей */
export function timeAgo(iso: string, t: TFunction): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return t('crypto.ago.minutes', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('crypto.ago.hours', { count: hours });
  return t('crypto.ago.days', { count: Math.round(hours / 24) });
}
