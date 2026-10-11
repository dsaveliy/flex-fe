# Экран Crypto: спецификация для бэкенда и API

> Статус: фронтенд работает на mock-данных (`src/api/config.ts → USE_MOCK_API = true`).
> Общие соглашения (camelCase, деньги в минорных единицах, ошибки) описаны в `docs/home-screen.md`, §2.
> Источник правды по типам — `src/api/types.ts`, по маршрутам — `src/api/services.ts`.

## 1. Концепция

Crypto — **рабочий стол из виджетов**, как экран iPhone. Пользователь сам решает, какие виджеты на нём стоят и в каком порядке. Раскладка — это **персональная настройка пользователя**. Она хранится на бэкенде и одинакова на всех его устройствах.

| # | Блок | Эндпоинт |
|---|------|----------|
| 1 | Шапка: логотип Flex Crypto, карандаш (редактирование, только на «Мой стол»), аватар профиля | — |
| 2 | Поисковая строка | позже |
| 3 | Строка разделов: Мой стол, Курсы, Новости, Trade, Convert, Фиат, Портфель, Earn — переключает контент под собой | см. §6 |
| 4 | «Мой стол» — сетка виджетов | `GET /me/crypto-layout` |
| 5 | Режим редактирования: покачивание, «−» удаляет, перетаскивание меняет порядок, «+» открывает галерею, «Готово» закрывает | `PUT /me/crypto-layout` |
| 6 | Данные внутри виджетов | эндпоинты рынка, например `GET /markets?kind=crypto` |

## 2. Сетка

- 2 колонки. Ячейка квадратная, её сторона = (ширина экрана − отступы) / 2.
- Размеры виджетов: `small` 1×1, `medium` 2×1 (на всю ширину), `large` 2×2.
- Виджеты укладываются **по порядку массива** в первую свободную позицию (first-fit), как в iOS. Поэтому бэкенду достаточно хранить порядок, координаты не нужны.

## 3. Хранение

Одна запись на пользователя, например колонка `jsonb` в таблице настроек `user_settings.crypto_layout` или отдельная таблица `user_crypto_layouts (user_id PK, widgets jsonb, updated_at)`.

**Раскладка по умолчанию** отдаётся, если пользователь ещё ничего не сохранял. Её задаёт сервер, чтобы её можно было менять без релиза приложения. Сейчас в mock такая раскладка:
```json
{ "widgets": [
  { "id": "w-portfolio", "kind": "portfolio", "size": "medium" },
  { "id": "w-btc", "kind": "assetRate", "size": "small", "params": { "assetId": "btc" } },
  { "id": "w-eth", "kind": "assetRate", "size": "small", "params": { "assetId": "eth" } },
  { "id": "w-movers", "kind": "movers", "size": "medium", "params": { "direction": "gainers" } },
  { "id": "w-fear", "kind": "fearGreed", "size": "small" },
  { "id": "w-convert", "kind": "convert", "size": "small", "params": { "from": "btc", "to": "usdt" } },
  { "id": "w-news", "kind": "news", "size": "medium" }
] }
```

## 4. Эндпоинты

### `GET /me/crypto-layout` → `CryptoLayout`
```json
{
  "widgets": [
    { "id": "w-btc", "kind": "assetRate", "size": "small", "params": { "assetId": "btc" } }
  ],
  "updatedAt": "2026-10-10T12:00:00Z"
}
```

### `PUT /me/crypto-layout` → `CryptoLayout`
Тело: `{ "widgets": CryptoWidget[] }`. Запрос **заменяет раскладку целиком**: после перетаскивания, удаления или добавления клиент отправляет новый массив. Клиент обновляет экран сразу (оптимистично) и откатывает изменения, если запрос вернул ошибку.

Валидация, при нарушении — `422 invalid_layout`:
- `id` — строка до 64 символов, уникальная в пределах раскладки (генерирует клиент);
- `kind` — только из пула виджетов (см. §5);
- `size` — только из размеров, разрешённых для этого `kind`;
- `params` — только известные ключи вида; `assetId` должен существовать в `GET /markets`;
- не больше 30 виджетов.

## 5. Пул виджетов

| `kind` | Размеры | `params` | Данные | Тап открывает |
|--------|---------|----------|--------|---------------|
| `assetRate` — курс монеты | `small`, `medium`, `large` | `assetId` | `GET /markets?kind=crypto` | Курсы |
| `portfolio` — стоимость и доли портфеля | `medium`, `large` | — | `GET /portfolio` | Портфель |
| `movers` — лидеры роста/падения | `medium`, `large` | `direction`: `gainers \| losers` | `GET /markets/movers` | Курсы |
| `watchlist` — избранные монеты | `large` | `assetIds`: до 4 id | `GET /markets` | Курсы |
| `news` — заголовки | `medium`, `large` | — | `GET /news?limit=3` | Новости |
| `convert` — быстрый обмен пары | `small` | `from`, `to` | `GET /markets?kind=crypto` | Convert |
| `fearGreed` — индекс страха и жадности | `small` | — | `GET /markets/fear-greed` | Курсы |

На фронте каждый вид — одна запись в `src/features/crypto/widgets/registry.ts`. На бэкенде новый `kind` и его размеры нужно добавить в валидацию.

## 6. Разделы и новые эндпоинты

| Раздел | Данные |
|--------|--------|
| Курсы | `GET /markets?kind=crypto`, `GET /markets/movers?direction=…` |
| Новости | `GET /news` |
| Trade | `GET /markets?kind=crypto`; ордера — позже |
| Convert | курс пары считается на клиенте из цен `GET /markets` (обе в USD); сам обмен — позже (`POST /convert`) |
| Фиат | `GET /markets?kind=fiat` (котировки к BYN) |
| Портфель | `GET /portfolio` |
| Earn | `GET /earn/products`; подключение — позже |

### `GET /news?limit=` → `NewsItem[]` (новый)
```json
[{ "id": "n1", "title": "…", "source": "CoinDesk", "publishedAt": "2026-10-10T11:48:00Z", "assetSymbol": "BTC", "url": "https://…" }]
```
Отсортированы от новых к старым. `assetSymbol` и `url` необязательны.

### `GET /markets/fear-greed` → `FearGreedIndex` (новый)
```json
{ "value": 68, "level": "greed", "previousValue": 61, "updatedAt": "2026-10-10T12:00:00Z" }
```
- `value`: 0–100.
- `level`: `extremeFear | fear | neutral | greed | extremeGreed`.

### `GET /earn/products` → `EarnProduct[]` (новый)
```json
[{ "id": "earn-eth-30", "assetId": "eth", "symbol": "ETH", "badgeColor": "#5966D9", "apyPercent": 4.2, "termDays": 30, "minAmount": 0.05 }]
```
- `termDays: null` — гибкий продукт, вывод в любой момент.
- `minAmount` указывается в единицах монеты.
