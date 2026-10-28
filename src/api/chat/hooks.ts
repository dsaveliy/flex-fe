import { useEffect, useSyncExternalStore } from 'react';

import type { ChatMember, ChatRoom } from '../types';
import { openChatRoom } from './client';
import { chatStore, type ChatState, IDLE_HISTORY, type LocalChatMessage, type RoomHistory } from './state';

const EMPTY_FEED: LocalChatMessage[] = [];
const EMPTY_TYPING: ChatMember[] = [];

function useChatSelector<T>(select: (state: ChatState) => T): T {
  return useSyncExternalStore(chatStore.subscribe, () => select(chatStore.get()));
}

/** статус соединения и было ли оно хоть раз — для плашки «Нет соединения» */
export function useChatConnection() {
  const status = useChatSelector((state) => state.status);
  const everConnected = useChatSelector((state) => state.everConnected);
  return { status, everConnected };
}

export function useChatMe(): ChatMember | null {
  return useChatSelector((state) => state.me);
}

export function useChatRooms(): ChatRoom[] {
  return useChatSelector((state) => state.rooms);
}

export function useChatRoomInfo(roomId: string): ChatRoom | undefined {
  return useChatSelector((state) => state.rooms.find((room) => room.id === roomId));
}

/** все непрочитанные — бейдж в профиле и точка на аватаре */
export function useChatUnreadCount(): number {
  return useChatSelector((state) =>
    state.rooms.reduce((sum, room) => sum + room.unreadCount, 0),
  );
}

export type ChatRoomFeed = {
  messages: LocalChatMessage[];
  history: RoomHistory;
  typing: ChatMember[];
};

/**
 * лента открытой комнаты. пока экран смонтирован (`active`), комната считается
 * открытой: история догружается, новые сообщения сразу помечаются прочитанными
 */
export function useChatRoom(roomId: string, active = true): ChatRoomFeed {
  const messages = useChatSelector((state) => state.messages[roomId] ?? EMPTY_FEED);
  const history = useChatSelector((state) => state.history[roomId] ?? IDLE_HISTORY);
  const typing = useChatSelector((state) => state.typing[roomId] ?? EMPTY_TYPING);

  useEffect(() => {
    if (!active) return;
    return openChatRoom(roomId);
  }, [roomId, active]);

  return { messages, history, typing };
}
