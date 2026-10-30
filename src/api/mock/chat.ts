import { randomUUID } from 'expo-crypto';

import { getAccessToken } from '@/auth/session';

import { ApiError, isApiError } from '../client';
import { API_BASE_URL, USE_MOCK_API } from '../config';
import type { ChatLink, ChatLinkHandlers } from '../chat/link';
import type {
  ChatAttachment,
  ChatClientFrame,
  ChatDirectBody,
  ChatEmoji,
  ChatMember,
  ChatMessage,
  ChatRoom,
  ChatServerFrame,
  ChatUploadFile,
  User,
} from '../types';
import { delay, respond } from './delay';
import { getDb } from './auth/db';
import { requireAccess } from './auth/guards';
import { fail } from './auth/tokens';

/**
 * «сервер» чата в памяти: Flex Lobby с тестовыми клиентами, которые пишут,
 * печатают и ставят реакции, и личные чаты с другим демо-аккаунтом, который
 * читает и отвечает. правила и коды ошибок — как в docs/chat.md,
 * чтобы экран вёл себя одинаково с mock и с настоящим WebSocket
 */

const LOBBY_ID = 'lobby';
const LOBBY_TITLE = 'Flex Lobby';
const MAX_TEXT = 2000;
const RATE_WINDOW_MS = 5_000;
const RATE_LIMIT = 5;
const AUTH_TIMEOUT_MS = 10_000;
const ALLOWED_EMOJI: ChatEmoji[] = ['👍', '❤️', '😂', '🔥', '🚀', '🙏'];

const member = (id: string, name: string, initials: string): ChatMember => ({
  id,
  name,
  initials,
  isStaff: false,
  isBot: true,
});

const BOTS = [
  member('bot-anna', 'Анна К.', 'АК'),
  member('bot-dmitry', 'Дмитрий С.', 'ДС'),
  member('bot-olga', 'Ольга М.', 'ОМ'),
  member('bot-igor', 'Игорь П.', 'ИП'),
  member('bot-kate', 'Катя Л.', 'КЛ'),
];

const AMBIENT = [
  'Кто уже пробовал Earn на ETH? Какая доходность выходит за месяц?',
  'BTC опять у 98k 🚀',
  'Перевод по номеру дошёл за секунду, удобно',
  'А можно заморозить карту прямо из приложения? Нашёл, в разделе Карты',
  'Ставлю на то, что к Новому году будет 100k',
  'Индекс страха и жадности сегодня 72 — жадность',
  'Подскажите, комиссия за обмен BYN → USD какая?',
  'Обмен — 1%, видно прямо в шторке перед подтверждением',
  'Liquid Glass в новом iOS тут выглядит очень красиво',
  'Кто держит USDT в Earn — выплаты каждый день?',
  'Доброе утро, Lobby ☕️',
  'Сегодня рынок зелёный 🟢',
];

const REPLIES: { match: RegExp; text: string[] }[] = [
  { match: /привет|здравств|hello|hi\b/i, text: ['Привет! 👋', 'Привет, добро пожаловать в Lobby'] },
  { match: /btc|биткоин|bitcoin/i, text: ['Я докупаю понемногу каждую неделю', 'BTC — долгосрок, не паникуем'] },
  { match: /earn|доход|процент/i, text: ['У меня ETH на 30 дней, 4,5% годовых', 'Earn норм, но крипта может просесть'] },
  { match: /\?$/, text: ['Хороший вопрос 🤔', 'Тоже интересно', 'Кажется, это есть в разделе Crypto'] },
];

const FALLBACK = ['👍', 'Согласен', 'Ха, точно 😂', 'Интересно', '+1'];
/** ответы собеседника в личном чате */
const DIRECT_REPLIES = ['Привет! 👋', 'Ага, понял', 'Сейчас посмотрю', 'Спасибо!', 'Давай 👍', 'Ок, договорились'];

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function seedLobby(): ChatMessage[] {
  const script: [number, number, string][] = [
    [2900, 0, 'Всем привет! Кто тут уже пользуется Crypto в Flex?'],
    [2895, 1, 'Я, с прошлой недели. KYC прошёл быстро'],
    [2880, 2, 'А карты как, выпускаются сразу?'],
    [2878, 1, 'Да, виртуальная — моментально'],
    [1500, 3, 'BTC пробил 97k 🚀'],
    [1490, 4, 'Ура, мой портфель снова в плюсе'],
    [1488, 0, 'Главное не продавать на эмоциях 😅'],
    [180, 2, 'Доброе утро, Lobby ☕️'],
    [95, 3, 'Кто-нибудь переводил через Flex на другой банк?'],
    [92, 1, 'Внутри Flex по номеру — мгновенно, на другой банк через «Вывести»'],
    [40, 4, 'Индекс страха и жадности сегодня 72 — жадность'],
    [12, 0, 'Кто уже пробовал Earn на ETH? Какая доходность выходит за месяц?'],
    [9, 2, 'У меня 4,5% годовых, начисляется каждый день'],
  ];
  return script
    .map(([ago, bot, text], index): ChatMessage => ({
      id: `seed-${index}`,
      roomId: LOBBY_ID,
      clientId: null,
      kind: 'text',
      author: BOTS[bot],
      text,
      replyTo: null,
      reactions:
        index === 4
          ? [{ emoji: '🚀', userIds: ['bot-anna', 'bot-olga', 'bot-kate'] }]
          : index === 9
            ? [{ emoji: '🙏', userIds: ['bot-igor'] }]
            : [],
      attachments: [],
      money: null,
      createdAt: minutesAgo(ago),
    }))
    .map((message, index, all) =>
      index === 12
        ? { ...message, replyTo: { id: all[11].id, authorName: all[11].author?.name ?? '', text: all[11].text } }
        : message,
    );
}

/** личная комната двух клиентов; пустая видна только тому, кто её открыл */
type MockDirect = { id: string; members: [ChatMember, ChatMember]; createdBy: string };

type MockChatDb = {
  /** сообщения комнаты в порядке отправки */
  messages: Record<string, ChatMessage[]>;
  /** загруженные, но ещё не отправленные вложения: id → (владелец, файл) */
  uploads: Record<string, { ownerId: string; attachment: ChatAttachment }>;
  directs: Record<string, MockDirect>;
  /** userId → roomId → последнее прочитанное */
  lastRead: Record<string, Record<string, string>>;
  /** (автор, clientId) → id: повтор отправки не создаёт дубль */
  byClientId: Record<string, string>;
  ambientOnline: number;
};

const db: MockChatDb = {
  messages: { [LOBBY_ID]: seedLobby() },
  uploads: {},
  directs: {},
  // три последних сообщения Lobby — «непрочитанные»
  lastRead: {},
  byClientId: {},
  ambientOnline: 9,
};

const connections = new Set<MockConnection>();

function toMember(user: Pick<User, 'id' | 'firstName' | 'lastName'>): ChatMember {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName.charAt(0)}.`,
    initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
    isStaff: false,
    isBot: false,
  };
}

let realMember: { token: string; member: ChatMember } | null = null;

/**
 * кто подключается. весь mock — токен проверяет mock-авторизация, как `require_access`.
 * чат на mock при настоящем API (`EXPO_PUBLIC_CHAT_MOCK`) — токен настоящий, его
 * проверяет сервер через `GET /me`; 401 → TOKEN_EXPIRED, клиент обновит токен
 */
async function authorize(): Promise<ChatMember> {
  if (USE_MOCK_API) return toMember((await requireAccess()).user);

  const token = getAccessToken();
  if (!token) throw new ApiError({ status: 401, code: 'TOKEN_INVALID', message: 'No token' });
  if (realMember?.token === token) return realMember.member;

  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    throw new ApiError({ status: 401, code: 'TOKEN_EXPIRED', message: 'Unauthorized' });
  }
  if (!response.ok) {
    throw new ApiError({ status: response.status, code: 'http_error', message: 'GET /me failed' });
  }
  const member = toMember((await response.json()) as User);
  realMember = { token, member };
  return member;
}

function onlineCount(): number {
  const people = new Set([...connections].map((connection) => connection.me?.id).filter(Boolean));
  return db.ambientOnline + people.size;
}

function lastReadOf(userId: string, roomId: string): string | undefined {
  if (!db.lastRead[userId]) {
    // новый клиент Lobby видит три последних сообщения непрочитанными
    const seed = db.messages[LOBBY_ID];
    db.lastRead[userId] = { [LOBBY_ID]: seed[seed.length - 4]?.id ?? '' };
  }
  return db.lastRead[userId][roomId];
}

function lobbyFor(userId: string): ChatRoom {
  const messages = db.messages[LOBBY_ID];
  const lastRead = lastReadOf(userId, LOBBY_ID);
  const readIndex = messages.findIndex((message) => message.id === lastRead);
  const unreadCount = messages
    .slice(readIndex + 1)
    .filter((message) => message.author?.id !== userId).length;

  return {
    id: LOBBY_ID,
    kind: 'lobby',
    title: LOBBY_TITLE,
    peer: null,
    onlineCount: onlineCount(),
    unreadCount,
    lastMessage: messages.at(-1) ?? null,
    peerLastReadMessageId: null,
  };
}

function broadcast(frame: ChatServerFrame): void {
  for (const connection of connections) connection.push(frame);
}

function isMember(roomId: string, userId: string): boolean {
  if (roomId === LOBBY_ID) return true;
  return Boolean(db.directs[roomId]?.members.some((item) => item.id === userId));
}

/** кадр комнаты: Lobby — всем, личной — только участникам */
function deliver(roomId: string, frame: ChatServerFrame): void {
  if (roomId === LOBBY_ID) return broadcast(frame);
  for (const connection of connections) {
    if (connection.me && isMember(roomId, connection.me.id)) connection.push(frame);
  }
}

function directFor(userId: string, direct: MockDirect): ChatRoom {
  const messages = db.messages[direct.id] ?? [];
  const peer = direct.members.find((item) => item.id !== userId) ?? direct.members[0];
  const lastRead = db.lastRead[userId]?.[direct.id];
  const readIndex = messages.findIndex((message) => message.id === lastRead);
  return {
    id: direct.id,
    kind: 'direct',
    title: peer.name,
    peer,
    // собеседник из mock всегда «в сети»
    onlineCount: 1,
    unreadCount: messages.slice(readIndex + 1).filter((message) => message.author?.id !== userId).length,
    lastMessage: messages.at(-1) ?? null,
    peerLastReadMessageId: db.lastRead[peer.id]?.[direct.id] ?? null,
  };
}

function roomsFor(userId: string): ChatRoom[] {
  const personal = Object.values(db.directs)
    .filter(
      (direct) =>
        direct.members.some((item) => item.id === userId) &&
        (direct.createdBy === userId || (db.messages[direct.id]?.length ?? 0) > 0),
    )
    .map((direct) => directFor(userId, direct))
    .sort((a, b) => Date.parse(b.lastMessage?.createdAt ?? '0') - Date.parse(a.lastMessage?.createdAt ?? '0'));
  return [lobbyFor(userId), ...personal];
}

/** собеседник читает (✓✓), печатает и отвечает */
function peerReplies(direct: MockDirect, message: ChatMessage): void {
  const peer = direct.members.find((item) => item.id !== message.author?.id);
  if (!peer) return;
  setTimeout(() => {
    db.lastRead[peer.id] = { ...db.lastRead[peer.id], [direct.id]: message.id };
    deliver(direct.id, { type: 'read', roomId: direct.id, userId: peer.id, messageId: message.id });
    deliver(direct.id, { type: 'typing', roomId: direct.id, user: peer });
  }, 1_200);
  setTimeout(() => {
    if (connections.size === 0) return;
    post(peer, pick(DIRECT_REPLIES), { roomId: direct.id });
  }, 3_500 + Math.random() * 1_500);
}

function post(author: ChatMember, text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  const message: ChatMessage = {
    id: randomUUID(),
    roomId: LOBBY_ID,
    clientId: null,
    kind: 'text',
    author,
    text,
    replyTo: null,
    reactions: [],
    attachments: [],
    money: null,
    createdAt: new Date().toISOString(),
    ...extra,
  };
  db.messages[message.roomId] = [...(db.messages[message.roomId] ?? []), message];
  deliver(message.roomId, { type: 'message', message });
  return message;
}

function toggleReaction(message: ChatMessage, userId: string, emoji: ChatEmoji): void {
  const current = message.reactions.find((reaction) => reaction.emoji === emoji);
  if (current?.userIds.includes(userId)) {
    current.userIds = current.userIds.filter((id) => id !== userId);
    message.reactions = message.reactions.filter((reaction) => reaction.userIds.length > 0);
  } else if (current) {
    current.userIds.push(userId);
  } else {
    message.reactions.push({ emoji, userIds: [userId] });
  }
  deliver(message.roomId, {
    type: 'reaction',
    roomId: message.roomId,
    messageId: message.id,
    reactions: message.reactions.map((reaction) => ({ ...reaction, userIds: [...reaction.userIds] })),
  });
}

/** тестовый клиент «печатает», затем пишет */
async function botSays(bot: ChatMember, text: string, replyTo?: ChatMessage): Promise<void> {
  broadcast({ type: 'typing', roomId: LOBBY_ID, user: bot });
  await delay(1_500 + Math.random() * 2_000);
  if (connections.size === 0) return;
  post(bot, text, {
    replyTo: replyTo
      ? { id: replyTo.id, authorName: replyTo.author?.name ?? '', text: replyTo.text.slice(0, 140) }
      : null,
  });
}

/** ответ Lobby на сообщение пользователя: иногда реакция, иногда ответ */
function reactToUser(message: ChatMessage): void {
  const bot = pick(BOTS);
  if (Math.random() < 0.5) {
    setTimeout(() => toggleReaction(message, pick(BOTS).id, pick(['👍', '🔥', '❤️'] as ChatEmoji[])), 1_200);
  }
  if (Math.random() < 0.75) {
    const rule = REPLIES.find((item) => item.match.test(message.text));
    const text = pick(rule?.text ?? FALLBACK);
    setTimeout(() => void botSays(bot, text, Math.random() < 0.4 ? message : undefined), 800);
  }
}

let ambientTimer: ReturnType<typeof setTimeout> | null = null;

/** жизнь Lobby, пока кто-то подключён: сообщения и колебания «онлайн» */
function scheduleAmbient(): void {
  if (ambientTimer || connections.size === 0) return;
  ambientTimer = setTimeout(
    () => {
      ambientTimer = null;
      if (connections.size === 0) return;
      if (Math.random() < 0.6) void botSays(pick(BOTS), pick(AMBIENT));
      db.ambientOnline = Math.max(4, Math.min(16, db.ambientOnline + pick([-1, 0, 1])));
      broadcast({ type: 'presence', roomId: LOBBY_ID, onlineCount: onlineCount() });
      scheduleAmbient();
    },
    20_000 + Math.random() * 25_000,
  );
}

class MockConnection implements ChatLink {
  me: ChatMember | null = null;
  private closed = false;
  private sent: number[] = [];
  private authTimer: ReturnType<typeof setTimeout>;

  constructor(private handlers: ChatLinkHandlers) {
    setTimeout(() => !this.closed && handlers.onOpen(), 150 + Math.random() * 250);
    this.authTimer = setTimeout(() => this.kick(4408, 'AUTH_TIMEOUT'), AUTH_TIMEOUT_MS);
  }

  /** доставка кадра клиенту с сетевой задержкой */
  push(frame: ChatServerFrame): void {
    if (!this.me) return;
    setTimeout(() => !this.closed && this.handlers.onFrame(frame), 60 + Math.random() * 140);
  }

  send(frame: ChatClientFrame): void {
    if (this.closed) return;
    void this.receive(frame);
  }

  close(): void {
    this.leave();
  }

  /** сервер закрывает соединение: `error` с кодом, затем close code */
  kick(code: number, reason: string): void {
    if (this.closed) return;
    this.handlers.onFrame({ type: 'error', code: reason });
    this.leave();
    this.handlers.onClose(code, reason);
  }

  /** обрыв сети без кадров — для кнопки в AuthDebugCard */
  drop(): void {
    if (this.closed) return;
    this.leave();
    this.handlers.onClose(1006, '');
  }

  private leave(): void {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.authTimer);
    const wasOnline = Boolean(this.me);
    connections.delete(this);
    if (wasOnline) broadcast({ type: 'presence', roomId: LOBBY_ID, onlineCount: onlineCount() });
  }

  private error(code: string, clientId?: string, retryAfter?: number): void {
    setTimeout(() => !this.closed && this.handlers.onFrame({ type: 'error', code, clientId, retryAfter }), 80);
  }

  private async receive(frame: ChatClientFrame): Promise<void> {
    if (frame.type === 'auth') {
      await this.authenticate();
      return;
    }
    if (!this.me) {
      this.kick(4401, 'TOKEN_INVALID');
      return;
    }
    const me = this.me;

    switch (frame.type) {
      case 'ping':
        this.push({ type: 'pong' });
        return;
      case 'typing':
        // кроме вас в Lobby только тестовые клиенты — пересылать некому
        return;
      case 'read':
        db.lastRead[me.id] = { ...db.lastRead[me.id], [frame.roomId]: frame.messageId };
        return;
      case 'react': {
        const message = Object.values(db.messages)
          .flat()
          .find((item) => item.id === frame.messageId);
        if (!message || !isMember(message.roomId, me.id)) return this.error('MESSAGE_NOT_FOUND');
        if (!ALLOWED_EMOJI.includes(frame.emoji)) return this.error('EMOJI_NOT_ALLOWED');
        toggleReaction(message, me.id, frame.emoji);
        return;
      }
      case 'send':
        this.handleSend(me, frame);
        return;
    }
  }

  private handleSend(me: ChatMember, frame: Extract<ChatClientFrame, { type: 'send' }>): void {
    if (!isMember(frame.roomId, me.id) || (frame.roomId !== LOBBY_ID && !db.directs[frame.roomId])) {
      return this.error('ROOM_NOT_FOUND', frame.clientId);
    }
    const roomMessages = db.messages[frame.roomId] ?? [];

    // повтор с тем же clientId — то же сообщение, без дубля
    const existingId = db.byClientId[`${me.id}:${frame.clientId}`];
    const existing = existingId && roomMessages.find((message) => message.id === existingId);
    if (existing) {
      this.push({ type: 'message', message: existing });
      return;
    }

    const ids = frame.attachmentIds ?? [];
    if (ids.length > 0 && frame.roomId === LOBBY_ID) {
      return this.error('ATTACHMENTS_NOT_ALLOWED', frame.clientId);
    }
    const files = ids.map((id) => db.uploads[id]);
    if (files.some((upload) => !upload || upload.ownerId !== me.id)) {
      return this.error('ATTACHMENT_NOT_FOUND', frame.clientId);
    }
    const text = frame.text.trim();
    if (!text && ids.length === 0) return this.error('MESSAGE_EMPTY', frame.clientId);
    if (text.length > MAX_TEXT) return this.error('MESSAGE_TOO_LONG', frame.clientId);

    const now = Date.now();
    this.sent = this.sent.filter((at) => now - at < RATE_WINDOW_MS);
    if (this.sent.length >= RATE_LIMIT) {
      return this.error('RATE_LIMITED', frame.clientId, Math.ceil((RATE_WINDOW_MS - (now - this.sent[0])) / 1000));
    }
    this.sent.push(now);

    const reply = frame.replyToId
      ? roomMessages.find((message) => message.id === frame.replyToId)
      : undefined;
    if (frame.replyToId && !reply) return this.error('MESSAGE_NOT_FOUND', frame.clientId);

    for (const id of ids) delete db.uploads[id];
    const message = post(me, text, {
      roomId: frame.roomId,
      clientId: frame.clientId,
      attachments: files.map((upload) => upload.attachment),
      replyTo: reply
        ? { id: reply.id, authorName: reply.author?.name ?? '', text: reply.text.slice(0, 140) }
        : null,
    });
    db.byClientId[`${me.id}:${frame.clientId}`] = message.id;
    db.lastRead[me.id] = { ...db.lastRead[me.id], [frame.roomId]: message.id };
    const direct = db.directs[frame.roomId];
    if (direct) peerReplies(direct, message);
    else reactToUser(message);
  }

  /** проверка access как у `require_access`; ошибки — кадр `error` и close code (docs/chat.md §3.1) */
  private async authenticate(): Promise<void> {
    try {
      const me = await authorize();
      if (this.closed) return;
      clearTimeout(this.authTimer);
      this.me = me;
      connections.add(this);
      broadcast({ type: 'presence', roomId: LOBBY_ID, onlineCount: onlineCount() });
      this.push({ type: 'ready', me: this.me, rooms: roomsFor(this.me.id) });
      scheduleAmbient();
    } catch (error) {
      const code = isApiError(error) ? error.code : 'TOKEN_INVALID';
      this.kick(code === 'TOKEN_REVOKED' || code === 'ACCOUNT_BLOCKED' ? 4403 : 4401, code);
    }
  }
}

export function connectMockChat(handlers: ChatLinkHandlers): ChatLink {
  return new MockConnection(handlers);
}

/** только для AuthDebugCard: оборвать соединения, как при пропаже сети */
export function dropMockChatConnections(): void {
  for (const connection of [...connections]) connection.drop();
}

export const mockChatApi = {
  getChatRooms: async (): Promise<ChatRoom[]> => {
    const me = await authorize();
    return respond(roomsFor(me.id));
  },

  getChatMessages: async (
    roomId: string,
    params?: { before?: string; limit?: number },
  ): Promise<ChatMessage[]> => {
    const me = await authorize();
    if (!isMember(roomId, me.id) || (roomId !== LOBBY_ID && !db.directs[roomId])) {
      fail(404, 'ROOM_NOT_FOUND');
    }
    const all = db.messages[roomId] ?? [];
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 100);
    const end = params?.before ? all.findIndex((message) => message.id === params.before) : all.length;
    const slice = all.slice(Math.max(0, (end < 0 ? 0 : end) - limit), end < 0 ? 0 : end);
    return respond([...slice].reverse());
  },

  /** файл остаётся на устройстве: в mock ссылка — его локальный uri */
  uploadChatAttachment: async (file: ChatUploadFile): Promise<ChatAttachment> => {
    const me = await authorize();
    const image = /^image\/(jpeg|png|webp)$/.test(file.mimeType);
    if (!image && file.mimeType !== 'application/pdf') fail(415, 'FILE_TYPE_NOT_ALLOWED');
    if ((file.sizeBytes ?? 0) > 10 * 1024 * 1024) fail(413, 'FILE_TOO_LARGE');
    const attachment: ChatAttachment = {
      id: randomUUID(),
      kind: image ? 'image' : 'file',
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes ?? 0,
      width: null,
      height: null,
      url: file.uri,
      thumbnailUrl: image ? file.uri : null,
    };
    db.uploads[attachment.id] = { ownerId: me.id, attachment };
    await delay(600);
    return respond(attachment);
  },

  /** собеседник — другой демо-аккаунт по номеру; в mock Lobby кроме вас только боты */
  openDirectChat: async (body: ChatDirectBody): Promise<ChatRoom> => {
    const me = await authorize();
    if (!('phone' in body)) fail(404, 'RECIPIENT_NOT_FOUND');
    const phone = body.phone.replace(/[^\d+]/g, '');
    if (!/^\+375\d{9}$/.test(phone)) fail(422, 'PHONE_INVALID');
    const user = Object.values((await getDb()).users).find((item) => item.phone === phone);
    if (!user) fail(404, 'RECIPIENT_NOT_FOUND');
    if (user.id === me.id) fail(422, 'SELF_CHAT');

    const peer = toMember(user);
    const existing = Object.values(db.directs).find((direct) =>
      direct.members.every((item) => item.id === me.id || item.id === peer.id),
    );
    const direct = existing ?? { id: randomUUID(), members: [me, peer], createdBy: me.id };
    db.directs[direct.id] = direct;
    return respond(directFor(me.id, direct));
  },
};
