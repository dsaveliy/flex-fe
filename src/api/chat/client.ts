import { randomUUID } from 'expo-crypto';
import { AppState, Platform } from 'react-native';

import { getAccessToken, sessionStore } from '@/auth/session';
import { ensureFreshAccess, refreshSession, signOutLocal } from '@/auth/sessionActions';

import { api } from '../api';
import type { ChatEmoji, ChatMember, ChatMessage, ChatServerFrame } from '../types';
import { type ChatLink, openChatLink } from './link';
import {
  addHistoryPage,
  addLocalMessage,
  applyMessage,
  applyPresence,
  applyReaction,
  applyRead,
  applyRooms,
  chatStore,
  IDLE_HISTORY,
  type LocalChatMessage,
  pendingMessages,
  replaceMessage,
  resetChatState,
  setDelivery,
  setHistory,
  setTyping,
  upsertRoom,
} from './state';

/** пульс и переподключение — docs/chat.md §3.2 */
const PING_MS = 25_000;
const MAX_MISSED_PONGS = 2;
const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 15_000];
/** сколько показывать «печатает» без новых кадров */
const TYPING_TTL_MS = 5_000;
const TYPING_THROTTLE_MS = 3_000;
/** без ответа сервера за это время пузырь становится «Не отправлено» */
const SEND_TIMEOUT_MS = 15_000;
const PAGE_SIZE = 50;

let link: ChatLink | null = null;
let attempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let missedPongs = 0;
let lastErrorCode: string | null = null;
let activeRoomId: string | null = null;
/** вошли и приложение на экране: только тогда держим соединение */
let wanted = false;
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const sendTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lastTypingSent = new Map<string, number>();

const update = (fn: Parameters<typeof chatStore.set>[0]) => chatStore.set(fn);
const isOnline = () => chatStore.get().status === 'online';

/* ───────────── соединение ───────────── */

function connect(): void {
  if (link || !wanted) return;
  clearReconnect();
  lastErrorCode = null;
  update((state) => ({ ...state, status: 'connecting' }));

  const current: ChatLink = openChatLink({
    onOpen: () => void authenticate(current),
    onFrame: (frame) => {
      if (link === current) handleFrame(frame);
    },
    onClose: (code, reason) => {
      if (link !== current) return;
      link = null;
      stopPing();
      void handleClose(code, lastErrorCode ?? reason);
    },
  });
  link = current;
}

/** первый кадр — access-токен (заголовки к WebSocket в браузере не задать) */
async function authenticate(current: ChatLink): Promise<void> {
  try {
    await ensureFreshAccess();
  } catch {
    // без свежего токена сервер ответит TOKEN_EXPIRED — разберёмся в handleClose
  }
  const token = getAccessToken();
  if (link !== current) return;
  if (!token) {
    drop();
    return;
  }
  current.send({ type: 'auth', token });
}

function disconnect(): void {
  clearReconnect();
  stopPing();
  const current = link;
  link = null;
  current?.close();
  update((state) => ({ ...state, status: 'idle' }));
}

/** соединение повисло (нет pong) — закрываем и переподключаемся */
function drop(): void {
  const current = link;
  link = null;
  stopPing();
  current?.close();
  void handleClose(1006, 'dropped');
}

async function handleClose(code: number, reason: string): Promise<void> {
  clearSendTimers();
  if (!wanted) {
    update((state) => ({ ...state, status: 'idle' }));
    return;
  }
  update((state) => ({ ...state, status: 'offline' }));

  if (code === 4401 && reason === 'TOKEN_EXPIRED') {
    try {
      await refreshSession();
      attempt = 0;
      connect();
    } catch {
      // refresh сам выводит из аккаунта при 401/403; без сети — обычный повтор
      scheduleReconnect();
    }
    return;
  }
  if (code === 4401 || code === 4403) {
    await signOutLocal('revoked');
    return;
  }
  scheduleReconnect();
}

function scheduleReconnect(): void {
  clearReconnect();
  const wait = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
  attempt += 1;
  reconnectTimer = setTimeout(connect, wait);
}

function clearReconnect(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function startPing(): void {
  stopPing();
  missedPongs = 0;
  pingTimer = setInterval(() => {
    if (missedPongs >= MAX_MISSED_PONGS) {
      drop();
      return;
    }
    missedPongs += 1;
    link?.send({ type: 'ping' });
  }, PING_MS);
}

function stopPing(): void {
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = null;
}

/** переподключиться сейчас, не дожидаясь паузы (кнопка «Повторить») */
export function reconnectChat(): void {
  if (link || !wanted) return;
  attempt = 0;
  connect();
}

/* ───────────── кадры сервера ───────────── */

function handleFrame(frame: ChatServerFrame): void {
  switch (frame.type) {
    case 'ready':
      attempt = 0;
      update((state) =>
        applyRooms({ ...state, status: 'online', everConnected: true, me: frame.me }, frame.rooms),
      );
      startPing();
      flushPending();
      // пока были офлайн, в открытой комнате могли появиться сообщения
      if (activeRoomId) void loadLatest(activeRoomId);
      return;
    case 'message':
      clearSendTimer(frame.message.clientId);
      update((state) => applyMessage(state, frame.message, activeRoomId));
      if (frame.message.roomId === activeRoomId) markRead(frame.message.roomId);
      return;
    case 'message_update':
      update((state) => replaceMessage(state, frame.message));
      return;
    case 'reaction':
      update((state) => applyReaction(state, frame.roomId, frame.messageId, frame.reactions));
      return;
    case 'presence':
      update((state) => applyPresence(state, frame.roomId, frame.onlineCount));
      return;
    case 'read':
      update((state) => applyRead(state, frame.roomId, frame.userId, frame.messageId));
      return;
    case 'room':
      update((state) => upsertRoom(state, frame.room));
      return;
    case 'typing':
      showTyping(frame.roomId, frame.user);
      return;
    case 'error':
      lastErrorCode = frame.code;
      if (frame.clientId) {
        clearSendTimer(frame.clientId);
        update((state) => setDelivery(state, frame.clientId ?? '', 'failed', frame.code));
      }
      return;
    case 'pong':
      missedPongs = 0;
      return;
  }
}

function showTyping(roomId: string, user: ChatMember): void {
  if (user.id === chatStore.get().me?.id) return;
  const key = `${roomId}:${user.id}`;
  const others = (chatStore.get().typing[roomId] ?? []).filter((item) => item.id !== user.id);
  update((state) => setTyping(state, roomId, [...others, user]));

  const previous = typingTimers.get(key);
  if (previous) clearTimeout(previous);
  typingTimers.set(
    key,
    setTimeout(() => {
      typingTimers.delete(key);
      const rest = (chatStore.get().typing[roomId] ?? []).filter((item) => item.id !== user.id);
      update((state) => setTyping(state, roomId, rest));
    }, TYPING_TTL_MS),
  );
}

/* ───────────── отправка ───────────── */

function sendFrame(message: LocalChatMessage): void {
  link?.send({
    type: 'send',
    clientId: message.clientId ?? '',
    roomId: message.roomId,
    text: message.text,
    replyToId: message.replyTo?.id,
  });
  armSendTimer(message.clientId ?? '');
}

/** после переподключения — те же `clientId`, сервер не создаст дубль (docs/chat.md §4.2) */
function flushPending(): void {
  for (const message of pendingMessages(chatStore.get())) sendFrame(message);
}

function armSendTimer(clientId: string): void {
  clearSendTimer(clientId);
  sendTimers.set(
    clientId,
    setTimeout(() => {
      sendTimers.delete(clientId);
      update((state) => setDelivery(state, clientId, 'failed', 'TIMEOUT'));
    }, SEND_TIMEOUT_MS),
  );
}

function clearSendTimer(clientId: string | null): void {
  if (!clientId) return;
  const timer = sendTimers.get(clientId);
  if (timer) clearTimeout(timer);
  sendTimers.delete(clientId);
}

/** обрыв во время отправки: очередь ждёт переподключения, таймеры не нужны */
function clearSendTimers(): void {
  for (const timer of sendTimers.values()) clearTimeout(timer);
  sendTimers.clear();
}

export function sendChatMessage(
  roomId: string,
  text: string,
  replyTo?: ChatMessage | null,
): void {
  const { me } = chatStore.get();
  const body = text.trim();
  if (!me || !body) return;

  const clientId = randomUUID();
  const message: LocalChatMessage = {
    id: `local:${clientId}`,
    roomId,
    clientId,
    kind: 'text',
    author: me,
    text: body,
    replyTo: replyTo
      ? { id: replyTo.id, authorName: replyTo.author?.name ?? '', text: replyTo.text.slice(0, 140) }
      : null,
    reactions: [],
    attachments: [],
    money: null,
    createdAt: new Date().toISOString(),
    delivery: 'sending',
  };
  update((state) => addLocalMessage(state, message));
  if (isOnline()) sendFrame(message);
}

export function retryChatMessage(clientId: string): void {
  update((state) => setDelivery(state, clientId, 'sending'));
  const message = pendingMessages(chatStore.get()).find((item) => item.clientId === clientId);
  if (message && isOnline()) sendFrame(message);
}

export function discardChatMessage(roomId: string, clientId: string): void {
  update((state) => ({
    ...state,
    messages: {
      ...state.messages,
      [roomId]: (state.messages[roomId] ?? []).filter((message) => message.clientId !== clientId),
    },
  }));
}

/** реакция сразу на экране; кадр `reaction` сервера потом приводит её к общему виду */
export function toggleChatReaction(roomId: string, messageId: string, emoji: ChatEmoji): void {
  const { me, messages } = chatStore.get();
  const message = messages[roomId]?.find((item) => item.id === messageId);
  if (!me || !message || message.delivery !== 'sent') return;

  const current = message.reactions.find((reaction) => reaction.emoji === emoji);
  const mine = current?.userIds.includes(me.id) ?? false;
  const reactions = mine
    ? message.reactions
        .map((reaction) =>
          reaction.emoji === emoji
            ? { ...reaction, userIds: reaction.userIds.filter((id) => id !== me.id) }
            : reaction,
        )
        .filter((reaction) => reaction.userIds.length > 0)
    : current
      ? message.reactions.map((reaction) =>
          reaction.emoji === emoji ? { ...reaction, userIds: [...reaction.userIds, me.id] } : reaction,
        )
      : [...message.reactions, { emoji, userIds: [me.id] }];

  update((state) => applyReaction(state, roomId, messageId, reactions));
  link?.send({ type: 'react', messageId, emoji });
}

export function notifyChatTyping(roomId: string): void {
  const now = Date.now();
  if (!isOnline() || now - (lastTypingSent.get(roomId) ?? 0) < TYPING_THROTTLE_MS) return;
  lastTypingSent.set(roomId, now);
  link?.send({ type: 'typing', roomId });
}

/* ───────────── комнаты и история ───────────── */

function markRead(roomId: string): void {
  const newest = chatStore.get().messages[roomId]?.find((message) => message.delivery === 'sent');
  const room = chatStore.get().rooms.find((item) => item.id === roomId);
  if (room?.unreadCount) {
    update((state) => applyRead(state, roomId, state.me?.id ?? '', newest?.id ?? ''));
  }
  if (newest && isOnline()) link?.send({ type: 'read', roomId, messageId: newest.id });
}

async function loadLatest(roomId: string): Promise<void> {
  const history = chatStore.get().history[roomId] ?? IDLE_HISTORY;
  if (history.status === 'idle' || history.status === 'error') {
    update((state) => setHistory(state, roomId, { status: 'loading' }));
  }
  try {
    const page = await api.getChatMessages(roomId, { limit: PAGE_SIZE });
    update((state) =>
      setHistory(addHistoryPage(state, roomId, page), roomId, {
        status: 'ready',
        exhausted: history.status === 'ready' ? history.exhausted : page.length < PAGE_SIZE,
      }),
    );
    markRead(roomId);
  } catch {
    if (history.status !== 'ready') update((state) => setHistory(state, roomId, { status: 'error' }));
  }
}

/** экран чата открыт: история, «прочитано», без счётчика непрочитанных для этой комнаты */
export function openChatRoom(roomId: string): () => void {
  activeRoomId = roomId;
  void loadLatest(roomId);
  return () => {
    if (activeRoomId === roomId) activeRoomId = null;
  };
}

export function reloadChatRoom(roomId: string): void {
  void loadLatest(roomId);
}

export async function loadOlderChatMessages(roomId: string): Promise<void> {
  const history = chatStore.get().history[roomId];
  const oldest = chatStore
    .get()
    .messages[roomId]?.filter((message) => message.delivery === 'sent')
    .at(-1);
  if (!history || history.status !== 'ready' || history.exhausted || history.loadingMore || !oldest) {
    return;
  }
  update((state) => setHistory(state, roomId, { loadingMore: true }));
  try {
    const page = await api.getChatMessages(roomId, { before: oldest.id, limit: PAGE_SIZE });
    update((state) =>
      setHistory(addHistoryPage(state, roomId, page), roomId, {
        loadingMore: false,
        exhausted: page.length < PAGE_SIZE,
      }),
    );
  } catch {
    update((state) => setHistory(state, roomId, { loadingMore: false }));
  }
}

/** список комнат по REST — для «потянуть, чтобы обновить» и пока сокет не подключился */
export async function refreshChatRooms(): Promise<void> {
  const rooms = await api.getChatRooms();
  update((state) => applyRooms(state, rooms));
  reconnectChat();
}

/* ───────────── жизненный цикл ───────────── */

function syncWanted(foreground: boolean): void {
  const next = foreground && sessionStore.get().status === 'signedIn';
  if (next === wanted) return;
  wanted = next;
  if (wanted) {
    attempt = 0;
    connect();
  } else {
    disconnect();
  }
}

/**
 * соединение живёт, пока пользователь вошёл и приложение на экране.
 * на web вкладку в фоне не отключаем: открытые рядом окна — обычный способ проверить чат
 */
export function startChatClient(): () => void {
  let foreground = Platform.OS === 'web' || AppState.currentState !== 'background';
  syncWanted(foreground);

  const offSession = sessionStore.subscribe(() => {
    const status = sessionStore.get().status;
    if (status === 'signedOut') {
      syncWanted(false);
      resetChatState();
      return;
    }
    syncWanted(foreground);
  });
  const appState = AppState.addEventListener('change', (state) => {
    if (Platform.OS === 'web') return;
    foreground = state === 'active' || (state !== 'background' && foreground);
    syncWanted(foreground);
  });

  return () => {
    offSession();
    appState.remove();
    wanted = false;
    disconnect();
  };
}
