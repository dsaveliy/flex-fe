import type { TFunction } from 'i18next';

import type { LocalChatMessage } from '@/api';
import { formatShortDate, formatShortDateWithYear } from '@/utils/format';

/** сообщения одного автора подряд в пределах этого окна рисуются одной группой */
const GROUP_WINDOW_MS = 5 * 60_000;

export type FeedItem =
  | {
      type: 'message';
      key: string;
      message: LocalChatMessage;
      own: boolean;
      /** верх группы: имя автора над пузырём */
      startsGroup: boolean;
      /** низ группы: аватар и «хвостик» пузыря */
      endsGroup: boolean;
    }
  | { type: 'date'; key: string; iso: string };

const dayKey = (iso: string) => new Date(iso).toDateString();

function sameGroup(a: LocalChatMessage, b: LocalChatMessage | undefined): boolean {
  if (!b || a.kind === 'system' || b.kind === 'system') return false;
  if (a.author?.id !== b.author?.id || dayKey(a.createdAt) !== dayKey(b.createdAt)) return false;
  return Math.abs(Date.parse(a.createdAt) - Date.parse(b.createdAt)) < GROUP_WINDOW_MS;
}

/**
 * лента для перевёрнутого списка: от новых к старым, разделитель даты идёт
 * после последнего (самого старого) сообщения дня — на экране он оказывается над ним
 */
export function buildFeed(messages: LocalChatMessage[], meId: string | undefined): FeedItem[] {
  const items: FeedItem[] = [];
  messages.forEach((message, index) => {
    const newer = messages[index - 1];
    const older = messages[index + 1];
    items.push({
      type: 'message',
      key: message.clientId ?? message.id,
      message,
      own: Boolean(meId) && message.author?.id === meId,
      startsGroup: !sameGroup(message, older),
      endsGroup: !sameGroup(message, newer),
    });
    if (!older || dayKey(older.createdAt) !== dayKey(message.createdAt)) {
      items.push({ type: 'date', key: `date:${dayKey(message.createdAt)}`, iso: message.createdAt });
    }
  });
  return items;
}

/** «Сегодня», «Вчера», «12 окт.», в прошлые годы — с годом */
export function dayLabel(iso: string, t: TFunction): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t('chat.today');
  if (date.toDateString() === yesterday.toDateString()) return t('chat.yesterday');
  return date.getFullYear() === today.getFullYear()
    ? formatShortDate(iso)
    : formatShortDateWithYear(iso);
}
