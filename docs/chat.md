# Чат Flex: контракт WebSocket и REST для бэкенда

> Статус: спринт 5 готов на фронтенде и бэкенде (`flex-be/app/api/routers/chat.py`, тесты `tests/test_chat.py`).
> Спринт 6: готовы личные чаты и доставка тем, кто был офлайн (`migrations/0006_chat_direct.sql`); вложения,
> поддержка и деньги — в работе. Mock для разработки без сервера — `src/api/mock/chat.ts`.
> Чат разрабатывается два спринта:
> - **Спринт 5** — групповой чат «Flex Lobby»: простые текстовые сообщения с рассылкой всем онлайн (BE-003, FLEX-184).
> - **Спринт 6** — личные сообщения, доставка тем, кто был офлайн, вложения, деньги в переписке, поддержка.
>
> Разделы, помеченные **[С6]**, в спринте 5 не нужны, но модель данных лучше сразу заложить под них
> (комнаты, хранение сообщений, отметки прочтения), чтобы потом не переделывать схему.

Источник правды по типам — `src/api/types.ts` (раздел «Чат»), по REST-маршрутам — `src/api/services.ts`,
по WebSocket — `src/api/chat/client.ts` (соединение, переподключение, очередь) и `src/api/chat/link.ts`. Общие соглашения (camelCase, деньги в минорных единицах, даты ISO 8601 UTC,
формат ошибок) — как в `flex-be/docs/api.md` §1 и §3.

---

## 1. Что видит пользователь

Вход — из профиля: строка **«Сообщения»** с числом непрочитанных; на аватаре в шапке любой вкладки — точка,
если есть непрочитанное. Таб-бар не меняется.

| Экран | Что на нём | Спринт |
|---|---|---|
| **Список чатов** `/messages` | Flex Lobby (последнее сообщение, «N онлайн», непрочитанные); поддержка закреплена сверху; личные чаты; «Новый чат» по номеру телефона | 5 (только Lobby) / 6 |
| **Чат** `/messages/{roomId}` | лента пузырей (свои — мятные справа, чужие — стеклянные слева, с аватаром-инициалами и именем), разделители дат, время, реакции, ответ на сообщение, «Анна печатает…», статус доставки, поиск по истории, поле ввода до 5 строк | 5 |
| Деньги в переписке | карточки перевода, запроса денег и крипто-конверта | 6 |

Состояния: загрузка (скелетоны), пустой чат, отправка (часики у пузыря), ошибка отправки («Не отправлено · Повторить»),
нет соединения (плашка «Нет соединения · переподключаемся…»), ошибка загрузки истории.

---

## 2. Модель данных

```ts
type ChatRoomKind = 'lobby' | 'direct' | 'support';

/** участник — минимум, чтобы нарисовать аватар-инициалы и имя */
type ChatMember = {
  id: string;            // users.id
  name: string;          // «Анна К.» — имя и первая буква фамилии, как recipientName в /transfers
  initials: string;      // «АК»
  isStaff: boolean;      // сотрудник поддержки (users.is_admin) — значок «Проверенный Flex»
  isBot: boolean;        // бот Flex Lobby — клиент пишет «бот» рядом с именем
};

type ChatRoom = {
  id: string;            // 'lobby' у общего чата, UUID у остальных
  kind: ChatRoomKind;
  title: string;         // 'Flex Lobby' / имя собеседника / 'Поддержка Flex'
  peer: ChatMember | null;      // собеседник в direct/support, иначе null
  onlineCount: number;   // lobby — сколько клиентов онлайн; direct — 1/0, онлайн ли собеседник
  unreadCount: number;   // сообщения после lastReadMessageId текущего пользователя, кроме его собственных
  lastMessage: ChatMessage | null;
  /** до какого сообщения прочитал собеседник — для ✓✓ (в direct; иначе null) */
  peerLastReadMessageId: string | null;
};

type ChatMessageKind = 'text' | 'system' | 'transfer' | 'request' | 'gift';

type ChatMessage = {
  id: string;            // UUID; сортировка — по createdAt, затем по id
  roomId: string;
  clientId: string | null;      // UUID, который придумал отправитель (см. §4.2); у системных — null
  kind: ChatMessageKind;
  author: ChatMember | null;    // null у системных сообщений
  text: string;          // 1–2000 символов после trim; у денежных — комментарий (может быть '')
  replyTo: { id: string; authorName: string; text: string } | null;  // text — первые 140 символов
  reactions: ChatReaction[];
  attachments: ChatAttachment[];  // [С6]; в спринте 5 всегда []
  money: ChatMoney | null;        // [С6] только у transfer / request / gift
  createdAt: string;     // ISO 8601 UTC, ставит сервер
};

type ChatReaction = { emoji: ChatEmoji; userIds: string[] };   // userIds непустой
type ChatEmoji = '👍' | '❤️' | '😂' | '🔥' | '🚀' | '🙏';
```

### Таблицы (предложение)

```sql
chat_rooms      (id text PK, kind text, created_at timestamptz)          -- строка 'lobby' создаётся миграцией
chat_members    (room_id, user_id, last_read_message_id uuid NULL, joined_at, PK(room_id, user_id))
chat_messages   (id uuid PK, room_id, client_id uuid NULL, author_id uuid NULL, kind text, text text,
                 reply_to_id uuid NULL, money jsonb NULL, created_at timestamptz,
                 UNIQUE(author_id, client_id))                             -- защита от дублей при переотправке
chat_reactions  (message_id, user_id, emoji text, PK(message_id, user_id, emoji))
chat_attachments(id uuid PK, owner_id, message_id NULL, kind, name, mime_type, size_bytes, width, height, storage_key, created_at)  -- [С6]
```

В Lobby участник — каждый клиент: строка `chat_members` создаётся при первом подключении (или неявно —
`unreadCount` считается от `last_read_message_id`, `NULL` = «прочитано всё до момента входа»).

---

## 3. Подключение

```
wss://flexbank.online/api/v1/chat/ws        (локально: ws://localhost:8000/api/v1/chat/ws)
```

- Адрес клиент получает из `EXPO_PUBLIC_API_URL` заменой `http` → `ws`. Caddy уже проксирует `/api/*` в `api:8000`
  (`flex-be/deploy/Caddyfile`); `reverse_proxy` пропускает WebSocket сам — отдельная настройка не нужна, только проверка (FLEX-194).
- Все кадры — **текстовые JSON** с полем `type`.
- FastAPI: `@router.websocket("/chat/ws")`. uvicorn запущен одним процессом (`Dockerfile`), поэтому реестр подключений
  можно держать в памяти: `dict[user_id, set[WebSocket]]` (у пользователя может быть несколько устройств/вкладок).

### 3.1 Авторизация первым кадром

Браузер не умеет ставить заголовки WebSocket, а токен в `?query` оседает в логах Caddy. Поэтому:

1. Клиент открывает соединение и **первым кадром** шлёт `{"type": "auth", "token": "<access>"}`.
2. Сервер проверяет токен так же, как `require_access` (подпись, тип `access`, отзыв, блокировка).
3. Успех → кадр `ready` (§4.3). Ошибка → кадр `error` и закрытие с кодом:

| Close code | `error.code` | Когда | Реакция клиента |
|---|---|---|---|
| `4401` | `TOKEN_EXPIRED` | access истёк (в т.ч. посреди соединения, см. ниже) | тихий refresh и переподключение |
| `4401` | `TOKEN_INVALID`, `WRONG_TOKEN_TYPE` | токен не прошёл проверку | выход на экран входа |
| `4403` | `TOKEN_REVOKED`, `ACCOUNT_BLOCKED` | сессия отозвана / клиент заблокирован | выход |
| `4408` | `AUTH_TIMEOUT` | за 10 с не пришёл `auth` | переподключение |
| `1001` | — | сервер перезапускается | переподключение |

Access живёт 15 минут. Сервер **может** закрыть соединение `4401 TOKEN_EXPIRED`, когда истекает `exp`, — клиент обновит
токен и подключится снова; это нормальный сценарий. При «Выйти» (`/auth/logout`) и отзыве сессии сокеты этого `sid`
нужно закрыть `4403 TOKEN_REVOKED`.

### 3.2 Пульс

Клиент шлёт `{"type": "ping"}` каждые 25 с, сервер отвечает `{"type": "pong"}`. Если 2 ответа подряд не пришли, клиент
переподключается. Переподключение — с нарастающей задержкой 1 → 2 → 4 → 8 → 15 с (максимум), сразу — когда
приложение возвращается из фона или появляется сеть.

---

## 4. Кадры

### 4.1 Клиент → сервер

| `type` | Поля | Что делает сервер | Спринт |
|---|---|---|---|
| `auth` | `token` | §3.1 | 5 |
| `send` | `clientId`, `roomId`, `text`, `replyToId?` | сохраняет и рассылает `message` всем участникам комнаты **включая отправителя** | 5 |
| `react` | `messageId`, `emoji` | переключает реакцию пользователя (была — убирает), рассылает `reaction` | 5 |
| `typing` | `roomId` | рассылает `typing` остальным участникам комнаты (не чаще раза в 3 с от пользователя) | 5 |
| `read` | `roomId`, `messageId` | двигает `last_read_message_id` вперёд (назад — игнорирует); шлёт `read` своим устройствам, а в direct — и собеседнику | 5 / 6 |
| `ping` | — | `pong` | 5 |

### 4.2 Отправка и дубли

- `clientId` — UUID, который клиент создаёт до отправки. Клиент сразу рисует пузырь с часиками, а когда приходит
  `message` с тем же `clientId` — заменяет его настоящим (часики → ✓).
- Без сети клиент держит сообщения в очереди и после переподключения шлёт их снова **с теми же `clientId`**. Сервер не
  создаёт второе сообщение (`UNIQUE(author_id, client_id)`), а повторно отправляет этому клиенту уже сохранённое.
- Ошибка отправки → `{"type": "error", "code": "…", "clientId": "…"}`, клиент помечает пузырь «Не отправлено».

| `error.code` | Когда |
|---|---|
| `MESSAGE_EMPTY` / `MESSAGE_TOO_LONG` | пустой текст после trim / длиннее 2000 символов |
| `ROOM_NOT_FOUND` | комнаты нет или пользователь не участник |
| `MESSAGE_NOT_FOUND` | `replyToId`/`messageId` не найден в этой комнате |
| `EMOJI_NOT_ALLOWED` | реакция не из списка `ChatEmoji` |
| `RATE_LIMITED` | больше 5 сообщений за 5 с; поле `retryAfter` (с) |
| `BAD_FRAME` | не JSON или неизвестный `type` |

### 4.3 Сервер → клиент

```jsonc
// сразу после успешного auth: кто я и список комнат (как GET /chat/rooms)
{ "type": "ready", "me": ChatMember, "rooms": ChatRoom[] }

// новое сообщение в комнате — всем участникам, включая автора (по clientId он узнаёт своё)
{ "type": "message", "message": ChatMessage }

// реакции сообщения целиком после изменения
{ "type": "reaction", "roomId": "lobby", "messageId": "…", "reactions": ChatReaction[] }

// кто-то печатает; клиент показывает «… печатает» 5 с или до его сообщения
{ "type": "typing", "roomId": "lobby", "user": ChatMember }

// изменилось число онлайн; в Lobby — при каждом подключении/отключении клиента
{ "type": "presence", "roomId": "lobby", "onlineCount": 12 }

// ошибка кадра; clientId — если ошибка про конкретную отправку
{ "type": "error", "code": "RATE_LIMITED", "message": "Too many messages", "clientId": "…", "retryAfter": 3 }

{ "type": "pong" }

// собеседник прочитал до messageId — у своих сообщений ✓ → ✓✓; userId = свой — прочитано с другого устройства
{ "type": "read", "roomId": "…", "userId": "…", "messageId": "…" }

// [С6] сообщение изменилось: запрос оплачен, конверт открыт
{ "type": "message_update", "message": ChatMessage }

// появилась новая комната: собеседник прислал первое сообщение — приходит до кадра message
{ "type": "room", "room": ChatRoom }
```

**Онлайн** = у пользователя есть хотя бы одно авторизованное соединение. Отключение последнего соединения → `presence`
с уменьшенным `onlineCount`. В direct `presence` с `onlineCount` 1/0 получает собеседник, когда у пользователя
появилось первое соединение или закрылось последнее.

**Кому уходят кадры.** Lobby — всем подключённым. Direct — **только двум участникам**: `message`, `reaction`, `typing`,
`read` и `presence` этой комнаты никто другой не получает. Для не-участника комнаты нет: `ROOM_NOT_FOUND` в REST и в
`send`, `MESSAGE_NOT_FOUND` на `react` — так нельзя даже узнать, существует ли чужое сообщение.

---

## 5. REST

Все — с access-токеном (`Authorization: Bearer`), ошибки — в обычном формате `docs/api.md` §3.

### `GET /chat/rooms` · access · спринт 5

Комнаты пользователя, сначала support, затем по времени последнего сообщения. В спринте 5 — массив из одной комнаты `lobby`.

```json
[{ "id": "lobby", "kind": "lobby", "title": "Flex Lobby", "peer": null, "onlineCount": 12, "unreadCount": 3,
   "lastMessage": { "id": "…", "roomId": "lobby", "kind": "text", "author": { "id": "…", "name": "Анна К.", "initials": "АК", "isStaff": false },
                    "text": "Кто уже пробовал Earn на ETH?", "clientId": null, "replyTo": null, "reactions": [],
                    "attachments": [], "money": null, "createdAt": "2026-10-28T18:20:11Z" },
   "peerLastReadMessageId": null }]
```

### `GET /chat/rooms/{roomId}/messages?before=<messageId>&limit=50` · access · спринт 5

История **от новых к старым** (так её рисует перевёрнутая лента). Без `before` — последние `limit` сообщений; следующая
страница — `before` = id самого старого из полученных. Пустой массив — история кончилась. `limit` 1–100, по умолчанию 50.
`404 ROOM_NOT_FOUND`, если пользователь не участник.

Поиск по истории (`?q=`) клиент в спринте 5 делает по загруженным сообщениям; серверный поиск — по желанию в спринте 6.

### `POST /chat/rooms/direct` → 200 · access · спринт 6

```json
{ "phone": "+375 29 111-22-33" }   →  ChatRoom (kind: "direct"; существующая, если уже переписывались)
{ "userId": "<id автора из Lobby>" }  →  то же — «написать лично» по аватару, номер собеседника не раскрывается
```
Ошибки — как у перевода: `404 RECIPIENT_NOT_FOUND` (нет такого клиента, он заблокирован или это бот),
`422 PHONE_INVALID`, `422 SELF_CHAT` (свой номер).

У пары клиентов одна комната (`chat_rooms.direct_key`). Пустая комната видна в списке только тому, кто её открыл;
собеседнику — с первого сообщения (он получает кадр `room`). `title` — имя собеседника, у каждого своё.
Боты в direct не пишут и не реагируют.

### `POST /chat/attachments` → 201 · access · [С6]

`multipart/form-data`, поле `file`. Изображения `image/jpeg|png|webp|heic` и `application/pdf`, до 10 МБ
(`413 FILE_TOO_LARGE`, `415 FILE_TYPE_NOT_ALLOWED`). Ответ:

```ts
type ChatAttachment = {
  id: string; kind: 'image' | 'file'; name: string; mimeType: string; sizeBytes: number;
  width: number | null; height: number | null;      // у изображений
  url: string;           // подписанная ссылка на 1 час: <img> и Image не умеют слать Authorization
  thumbnailUrl: string | null;
};
```
Затем `send` с `attachmentIds: string[]` (до 10); `text` тогда может быть пустым. Чужой или уже прикреплённый
`attachmentId` → `error ATTACHMENT_NOT_FOUND`.

### Деньги в переписке · [С6]

```ts
type ChatMoney =
  | { type: 'transfer'; transactionId: string; amount: Money; status: 'completed' }
  | { type: 'request'; requestId: string; amount: Money; status: 'pending' | 'paid' | 'declined'; paidTransactionId: string | null }
  | { type: 'gift'; giftId: string; asset: 'BTC' | 'USDT'; amount: Money | null;  // null у получателя, пока конверт не открыт
      status: 'sealed' | 'opened'; openedAt: string | null };
```

- **Перевод.** После каждого успешного `POST /transfers` между двумя клиентами сервер сам кладёт в их direct-комнату
  (создаёт при необходимости) сообщение `kind: "transfer"`, `text` = комментарий перевода, и рассылает `message`.
  Отдельного эндпоинта нет: перевод из шторки и из чата — один и тот же `POST /transfers`.
- **Запрос денег.** `POST /chat/rooms/{roomId}/requests {amountMinor, currency, comment?}` → `ChatMessage` (`kind: "request"`).
  Плательщик платит обычным `POST /transfers` с новым полем `requestId`; сервер переводит запрос в `paid` и шлёт
  `message_update`. `POST /chat/requests/{requestId}/decline` → `declined`.
- **Крипто-конверт.** `POST /chat/rooms/{roomId}/gifts {fromAccountId, amountMinor, comment?}` + `Idempotency-Key` ·
  **crypto** (Уровень 2). Деньги сразу списываются на системный счёт-«конверт». Получатель видит `amount: null`, пока не
  вызовет `POST /chat/gifts/{giftId}/open` · access → зачисление на его счёт этой валюты (создать, если нет),
  `message_update` обоим. Ошибки: `INSUFFICIENT_FUNDS`, `GIFT_ALREADY_OPENED`, `GIFT_NOT_FOUND`.

### Поддержка · [С6]

- У каждого клиента одна комната `kind: "support"` — создаётся при первом `GET /chat/rooms`, всегда первая в списке.
- Сотрудник = пользователь с `is_admin`; в своём списке он видит support-комнаты всех клиентов (`title` = имя клиента)
  и отвечает в них обычным `send`. У его сообщений `author.isStaff = true` — клиент рисует значок «Проверенный Flex».
  Значок **нельзя** получить в Lobby и direct: сервер не ставит `isStaff` вне support.
- `POST /chat/rooms/{roomId}/close` · admin → системное сообщение «Обращение закрыто»; клиент показывает оценку.
- `POST /chat/rooms/{roomId}/rating {score: 1..5, comment?}` · access → 204.
- Быстрые ответы («Не пришёл перевод», «Карта заблокирована», …) — только на клиенте, уходят обычным текстом.

### Офлайн-доставка · спринт 6

Сообщения хранятся в БД, поэтому получатель, который был офлайн, при подключении получает в `ready` комнаты с
`unreadCount` и `lastMessage`, а ленту догружает `GET /chat/rooms/{id}/messages`. Push-уведомления — вне этих спринтов.

---

### Боты Flex Lobby

В Lobby живут выдуманные персонажи (таблица `chat_bots`, тексты — `flex-be/app/services/chat_bots.py`): обычные клиенты
(Анна К., Дмитрий С., …) и «рэперы» со своей манерой (lil sat0shi, YUNG HODL, Фреш Кешбэк, МС Стейблкоин, Лил Ипотека,
Макс Орбит). У их сообщений `author.isBot = true`, `author.id` — `bot-…`; в реакциях их id тоже встречаются в `userIds`.

- на сообщение человека бот иногда ставит реакцию и отвечает (сначала кадр `typing`, через 1,5–3,5 с — `message`);
- пока в Lobby кто-то онлайн, раз в 1–2,5 мин один из ботов пишет сам, другой может подхватить;
- `onlineCount` = клиенты с открытым соединением + боты; выключаются `FLEX_CHAT_BOTS_ENABLED=false`.

Реальные люди (знаменитости, артисты) ботами не изображаются — только выдуманные имена.

## 6. Сценарии для тестов (TE-001, FLEX-211/212)

1. Без `auth` за 10 с → закрытие `4408`. Неверный токен → `error TOKEN_INVALID` + `4401`. Истёкший → `TOKEN_EXPIRED` + `4401`.
2. Подключились A и B → у A приходит `presence` с `onlineCount` +1; B отключился → `presence` −1. Второе устройство A не меняет счётчик.
3. A шлёт `send` в `lobby` → `message` получают **все** подключённые, включая A; у A совпадает `clientId`.
4. A повторяет `send` с тем же `clientId` → новой строки в БД нет, A снова получает то же сообщение.
5. Пустой текст / 2001 символ → `error` с `clientId`; 6 сообщений за 5 с → `RATE_LIMITED`.
6. `react` дважды тем же эмодзи → реакция появилась и исчезла; чужой эмодзи → `EMOJI_NOT_ALLOWED`.
7. `GET /chat/rooms/lobby/messages?limit=2` → 2 последних от новых к старым; `before` = id второго → следующие.
8. `read` → у этого пользователя `unreadCount` в `GET /chat/rooms` = 0; `read` более старым id не уменьшает прочитанное.
9. A пишет B, B офлайн → B подключается, в `ready` у комнаты `unreadCount` = 1, сообщение есть в истории.
10. C подключён, A пишет в direct с B → C не получает кадр; история комнаты для C — `404 ROOM_NOT_FOUND`,
    `react` — `MESSAGE_NOT_FOUND`, `send` — `ROOM_NOT_FOUND`.
11. B подключился / отключился → A получает `presence` комнаты с `onlineCount` 1 / 0; B прочитал → A получает `read`,
    а в `GET /chat/rooms` у A — `peerLastReadMessageId`.

## 7. Подключение фронтенда

Ничего настраивать не нужно: адрес WebSocket берётся из `EXPO_PUBLIC_API_URL`. Пока адреса нет — работает mock
(в Lobby «пишут» тестовые клиенты). Пока чата нет на сервере, `EXPO_PUBLIC_CHAT_MOCK=1` включает mock только для чата:
остальное API настоящее, пользователь чата берётся из `GET /me`. Личные чаты на настоящем сервере включаются, когда `EXPO_PUBLIC_CHAT_DIRECT=1`
(после выкатки API спринта 6).
