import { API_BASE_URL, USE_MOCK_CHAT } from '../config';
import { connectMockChat } from '../mock/chat';
import type { ChatClientFrame, ChatServerFrame } from '../types';

/**
 * одно соединение чата: настоящий WebSocket или mock-сервер с тем же поведением.
 * кадры уже разобраны из JSON; коды закрытия — как в docs/chat.md §3.1
 */
export type ChatLink = {
  send(frame: ChatClientFrame): void;
  close(): void;
};

export type ChatLinkHandlers = {
  onOpen(): void;
  onFrame(frame: ChatServerFrame): void;
  onClose(code: number, reason: string): void;
};

/** `https://host/api/v1` → `wss://host/api/v1/chat/ws`; относительный `/api/v1` веба — от адреса страницы */
export function chatSocketUrl(baseUrl: string): string {
  const absolute =
    baseUrl.startsWith('/') && typeof window !== 'undefined' && window.location
      ? `${window.location.origin}${baseUrl}`
      : baseUrl;
  return `${absolute.replace(/^http/, 'ws').replace(/\/$/, '')}/chat/ws`;
}

function connectWebSocket(handlers: ChatLinkHandlers): ChatLink {
  const socket = new WebSocket(chatSocketUrl(API_BASE_URL));
  let closed = false;

  socket.onopen = () => handlers.onOpen();
  socket.onmessage = (event) => {
    if (typeof event.data !== 'string') return;
    try {
      handlers.onFrame(JSON.parse(event.data) as ChatServerFrame);
    } catch {
      // сервер прислал не JSON — кадр пропускаем
    }
  };
  socket.onclose = (event) => {
    if (closed) return;
    closed = true;
    handlers.onClose(event.code, event.reason);
  };
  // ошибка сети всегда заканчивается onclose — там и переподключение
  socket.onerror = () => {};

  return {
    send(frame) {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(frame));
    },
    close() {
      closed = true;
      socket.close(1000);
    },
  };
}

export function openChatLink(handlers: ChatLinkHandlers): ChatLink {
  return USE_MOCK_CHAT ? connectMockChat(handlers) : connectWebSocket(handlers);
}
