import { type ReactNode, useEffect } from 'react';

import { startChatClient } from '@/api';

/**
 * соединение чата живёт всё время, пока пользователь вошёл и приложение на
 * экране: так бейдж непрочитанных в профиле обновляется без открытия чата
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  useEffect(() => startChatClient(), []);
  return children;
}
