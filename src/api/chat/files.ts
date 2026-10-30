import { API_BASE_URL } from '../config';

/**
 * ссылки на вложения сервер отдаёт путём от базового адреса API (`/chat/files/…?exp&sig`):
 * так одна и та же подпись работает на сайте (`/api/v1`) и в приложении (`https://…/api/v1`).
 * локальный файл (превью до отправки, mock) открывается как есть
 */
export function chatFileUrl(path: string): string {
  if (/^(https?:|blob:|file:|data:|content:|ph:)/.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}
