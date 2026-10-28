import { createStore } from '@/auth/store';

import type { ChatMember, ChatMessage, ChatReaction, ChatRoom } from '../types';

export type ChatConnectionStatus = 'idle' | 'connecting' | 'online' | 'offline';

/** `sending` — часики, `sent` — сервер сохранил, `failed` — «Не отправлено · Повторить» */
export type ChatDeliveryStatus = 'sending' | 'sent' | 'failed';

export type LocalChatMessage = ChatMessage & { delivery: ChatDeliveryStatus; errorCode?: string };

export type RoomHistory = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** старее сообщений на сервере нет */
  exhausted: boolean;
  loadingMore: boolean;
};

export type ChatState = {
  status: ChatConnectionStatus;
  /** было ли хоть одно подключение: до него плашку «нет соединения» не показываем */
  everConnected: boolean;
  me: ChatMember | null;
  /** порядок списка: поддержка сверху, затем по последнему сообщению */
  rooms: ChatRoom[];
  /** лента комнаты от новых к старым — как её рисует перевёрнутый список */
  messages: Record<string, LocalChatMessage[]>;
  history: Record<string, RoomHistory>;
  typing: Record<string, ChatMember[]>;
};

const initialState: ChatState = {
  status: 'idle',
  everConnected: false,
  me: null,
  rooms: [],
  messages: {},
  history: {},
  typing: {},
};

export const chatStore = createStore<ChatState>(initialState);

export function resetChatState(): void {
  chatStore.set(initialState);
}

export const IDLE_HISTORY: RoomHistory = { status: 'idle', exhausted: false, loadingMore: false };

const byNewest = (a: ChatMessage, b: ChatMessage) =>
  b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);

function sortRooms(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => {
    if (a.kind === 'support' && b.kind !== 'support') return -1;
    if (b.kind === 'support' && a.kind !== 'support') return 1;
    return (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? '');
  });
}

/**
 * сливает сообщения в ленту: одинаковый `id` заменяется, а свой пузырь
 * «с часиками» — сохранённым сервером по `clientId`
 */
export function mergeMessages(
  feed: LocalChatMessage[],
  incoming: ChatMessage[],
): LocalChatMessage[] {
  if (incoming.length === 0) return feed;
  const ids = new Set(incoming.map((message) => message.id));
  const clientIds = new Set(incoming.map((message) => message.clientId).filter(Boolean));
  const kept = feed.filter(
    (message) => !ids.has(message.id) && !(message.clientId && clientIds.has(message.clientId)),
  );
  const added = incoming.map((message): LocalChatMessage => ({ ...message, delivery: 'sent' }));
  return [...kept, ...added].sort(byNewest);
}

function updateRoom(state: ChatState, roomId: string, patch: (room: ChatRoom) => ChatRoom) {
  return state.rooms.map((room) => (room.id === roomId ? patch(room) : room));
}

export function applyRooms(state: ChatState, rooms: ChatRoom[]): ChatState {
  return { ...state, rooms: sortRooms(rooms) };
}

export function upsertRoom(state: ChatState, room: ChatRoom): ChatState {
  const others = state.rooms.filter((item) => item.id !== room.id);
  return { ...state, rooms: sortRooms([...others, room]) };
}

/** новое сообщение: в ленту, в «последнее» комнаты и в непрочитанные, если комната не открыта */
export function applyMessage(
  state: ChatState,
  message: ChatMessage,
  activeRoomId: string | null,
): ChatState {
  const feed = state.messages[message.roomId];
  const own = message.author?.id === state.me?.id;
  const known = feed?.some((item) => item.id === message.id);
  const rooms = updateRoom(state, message.roomId, (room) => ({
    ...room,
    lastMessage: message,
    unreadCount:
      own || known || activeRoomId === message.roomId ? room.unreadCount : room.unreadCount + 1,
  }));
  const typing = state.typing[message.roomId]?.filter((user) => user.id !== message.author?.id);

  return {
    ...state,
    rooms: sortRooms(rooms),
    // ленту, которую ещё не открывали, не заводим: она загрузится целиком из истории
    messages: feed ? { ...state.messages, [message.roomId]: mergeMessages(feed, [message]) } : state.messages,
    typing: typing ? { ...state.typing, [message.roomId]: typing } : state.typing,
  };
}

/** изменилось содержимое (запрос оплачен, конверт открыт) — без счётчика непрочитанных */
export function replaceMessage(state: ChatState, message: ChatMessage): ChatState {
  const feed = state.messages[message.roomId];
  const rooms = updateRoom(state, message.roomId, (room) =>
    room.lastMessage?.id === message.id ? { ...room, lastMessage: message } : room,
  );
  return {
    ...state,
    rooms,
    messages: feed
      ? { ...state.messages, [message.roomId]: mergeMessages(feed, [message]) }
      : state.messages,
  };
}

export function applyReaction(
  state: ChatState,
  roomId: string,
  messageId: string,
  reactions: ChatReaction[],
): ChatState {
  const feed = state.messages[roomId];
  if (!feed) return state;
  return {
    ...state,
    messages: {
      ...state.messages,
      [roomId]: feed.map((message) => (message.id === messageId ? { ...message, reactions } : message)),
    },
  };
}

export function applyPresence(state: ChatState, roomId: string, onlineCount: number): ChatState {
  return { ...state, rooms: updateRoom(state, roomId, (room) => ({ ...room, onlineCount })) };
}

export function applyRead(
  state: ChatState,
  roomId: string,
  userId: string,
  messageId: string,
): ChatState {
  if (userId === state.me?.id) {
    return { ...state, rooms: updateRoom(state, roomId, (room) => ({ ...room, unreadCount: 0 })) };
  }
  return {
    ...state,
    rooms: updateRoom(state, roomId, (room) => ({ ...room, peerLastReadMessageId: messageId })),
  };
}

export function setTyping(state: ChatState, roomId: string, users: ChatMember[]): ChatState {
  return { ...state, typing: { ...state.typing, [roomId]: users } };
}

export function addLocalMessage(state: ChatState, message: LocalChatMessage): ChatState {
  const feed = state.messages[message.roomId] ?? [];
  return { ...state, messages: { ...state.messages, [message.roomId]: [message, ...feed] } };
}

export function setDelivery(
  state: ChatState,
  clientId: string,
  delivery: ChatDeliveryStatus,
  errorCode?: string,
): ChatState {
  const messages: ChatState['messages'] = {};
  for (const [roomId, feed] of Object.entries(state.messages)) {
    messages[roomId] = feed.map((message) =>
      message.clientId === clientId && message.delivery !== 'sent'
        ? { ...message, delivery, errorCode }
        : message,
    );
  }
  return { ...state, messages };
}

export function setHistory(state: ChatState, roomId: string, patch: Partial<RoomHistory>): ChatState {
  const current = state.history[roomId] ?? IDLE_HISTORY;
  return { ...state, history: { ...state.history, [roomId]: { ...current, ...patch } } };
}

export function addHistoryPage(state: ChatState, roomId: string, page: ChatMessage[]): ChatState {
  const feed = state.messages[roomId] ?? [];
  return { ...state, messages: { ...state.messages, [roomId]: mergeMessages(feed, page) } };
}

/** отправленные, но не подтверждённые сообщения — очередь на переотправку после переподключения */
export function pendingMessages(state: ChatState): LocalChatMessage[] {
  return Object.values(state.messages)
    .flat()
    .filter((message) => message.delivery === 'sending')
    .reverse();
}
