# Аутентификация: два уровня входа (спецификация для бэкенда и устройство клиента)

> Статус: фронтенд готов и работает на mock-сервере авторизации (`src/api/config.ts → USE_MOCK_API = true`).
> Mock повторяет контракт будущего сервиса на FastAPI: те же эндпоинты, тела, коды ошибок.
> Когда бэкенд будет готов, достаточно поставить `USE_MOCK_API = false` и задать `EXPO_PUBLIC_API_URL`.

Основа — ТЗ «Промпт: двухуровневая аутентификация криптобанка Flex» и подход Doubletapp
(access/refresh, ротация, отзыв, `device_id`).

Где искать источник правды:
- типы — `src/api/types.ts` (раздел «аутентификация»);
- маршруты и какой токен нужен каждому методу — `src/api/services.ts` (`API_AUTH_SCOPE`);
- эталонное поведение сервера — `src/api/mock/auth/`.

---

## 1. Схема

```
Уровень 1 (приложение)              Уровень 2 (криптораздел, step-up)
логин + пароль + device_id          access + крипто-PIN или Face ID + device_id
        │                                    │
        ▼                                    ▼
access (15 мин) + refresh (30 дн)   crypto-токен: 10 мин без действий, максимум 30 мин,
ротация, отзыв, детект кражи        без refresh, отдельные aud и kid
```

Главный принцип: украденный access не открывает ни один эндпоинт crypto-api. Для него нужен
crypto-токен, а его выдают только после второго фактора.

Роли:
- **Basic** — фиатный банкинг;
- **Pro** — плюс криптораздел, после одобренного KYC.

Если Basic открывает Crypto, ему показывается предложение пройти KYC (`KYC_REQUIRED`), а не ошибка входа.

## 2. Токены (JWS compact, `header.payload.signature`)

Payload без чувствительных данных: JWT может прочитать кто угодно. Клиент только **декодирует**
payload (`src/auth/jws.ts`), чтобы знать `exp`, `role` и `sid`. Подпись проверяет сервер.

```jsonc
// access / refresh, подпись: kid уровня 1
{ "iss": "flex@auth_service", "sub": "<user_id>", "type": "access" | "refresh",
  "role": "basic" | "pro", "device_id": "<uuid>", "sid": "<uuid>",
  "jti": "<uuid>", "iat": 0, "nbf": 0, "exp": 0 }

// crypto, подпись: отдельный kid
{ "iss": "flex@auth_service", "sub": "<user_id>", "aud": "crypto-api",
  "type": "crypto_access", "scope": "crypto", "parent_jti": "<jti access>",
  "sid": "<uuid>", "device_id": "<uuid>", "amr": ["pwd", "pin" | "bio"],
  "jti": "<uuid>", "iat": 0, "exp": 0 }
```

`sid` — семейство токенов одного входа на устройстве. Этого поля нет в ТЗ, см. открытый вопрос 1 в §8.
- Выход, «выйти везде» и обнаружение кражи отзывают весь `sid`.
- Ротация refresh не меняет `sid`.

Подпись в проде: RS256 или EdDSA с `kid`, разные ключи для уровней 1 и 2. Mock имитирует HS256: SHA-256 от секрета и `header.payload`.

## 3. Эндпоинты

JSON в camelCase, как у остальных эндпоинтов (`docs/home-screen.md`).

| Метод и путь | Токен | Тело запроса → ответ |
|---|---|---|
| `POST /auth/register` | — | `{phone, email, password}` → `{verificationId, channels: ['phone','email']}`. Токены **не** выдаются |
| `POST /auth/verify` | — | `{verificationId, channel, code}` → `{remaining: Channel[]}` |
| `POST /auth/verify/resend` | — | `{verificationId, channel}` → `204` |
| `POST /auth/login` | — | `{identifier, password, deviceId}` → `{accessToken, refreshToken}` |
| `POST /auth/refresh` | refresh в теле (web — httpOnly-cookie) | `{refreshToken, deviceId}` → `{accessToken, refreshToken}` |
| `POST /auth/logout` | access | → `204`; отзывает весь `sid` |
| `GET /auth/crypto/status?device_id=` | access | → `CryptoAccessStatus {role, kycStatus, factorConfigured, biometricEnabled, lockedUntil, blocked}` |
| `POST /kyc/applications` | access | → `204`; `kycStatus = pending` |
| `POST /auth/crypto/setup` | access, роль Pro | `{pin, deviceId}` → `204`. Если PIN уже задан, `409 CRYPTO_ALREADY_CONFIGURED` |
| `POST /auth/crypto/login` | access | `{factor: {type:'pin', pin} \| {type:'biometric', credential}, deviceId}` → `{cryptoToken, idleTimeoutSec, expiresAt}` |
| `POST /auth/crypto/logout` | crypto | → `204` |
| `POST /auth/crypto/biometric` | crypto | `{enabled, deviceId}` → `{credential: string \| null}` |

Какой токен нужен эндпоинтам данных (матрица доступа ТЗ):

| Токен | Эндпоинты |
|---|---|
| нет (публичные) | `/markets`, `/markets/movers`, `/exchange-rates`, `/news`, `/markets/fear-greed` |
| access | `/me`, `/balance`, `/promo`, `/cards`, `/cards/{id}/details`, `/transactions` |
| crypto | `/portfolio`, `/me/crypto-layout` (GET и PUT), `/earn/products` |

Эндпоинты `/auth/sessions` и `DELETE /auth/sessions/{device_id}` (список устройств) есть в ТЗ, но в эту версию клиента не вошли.

## 4. Ошибки

Тело ошибки: `{code, message, attempts_left?, details?}`. Оно может лежать в корне или в FastAPI-`detail`. Время ожидания — в заголовке `Retry-After`.

| Ситуация | HTTP | `code` | Реакция клиента |
|---|---|---|---|
| Токен невалиден | 401 | `TOKEN_INVALID` | выход на экран входа |
| Access истёк | 401 | `TOKEN_EXPIRED` | тихий refresh и один повтор запроса |
| Токен отозван / повторный refresh | 403 | `TOKEN_REVOKED` | выход, «сессия завершена из соображений безопасности» |
| refresh вместо access и наоборот | 401 | `WRONG_TOKEN_TYPE` | — |
| Нет KYC | 403 | `KYC_REQUIRED` | экран KYC |
| Нужен второй фактор / crypto истёк | 403 | `CRYPTO_AUTH_REQUIRED` | Crypto закрывается и просит PIN |
| Неверный PIN или биометрия | 401 | `FACTOR_INVALID` + `attempts_left` | «Осталось попыток: N» |
| Лимит попыток | 429 | `TOO_MANY_ATTEMPTS` + `Retry-After` | таймер |
| Неверный логин или пароль | 401 | `INVALID_CREDENTIALS` | один текст для обоих полей |
| Контакты не подтверждены | 403 | `CONTACT_NOT_VERIFIED`, `details: {verificationId, channels}` | экран кода |
| Неверный код | 400 | `OTP_INVALID` | — |
| Верификация не найдена | 404 | `VERIFICATION_NOT_FOUND` | — |
| Уже занято | 409 | `PHONE_TAKEN`, `EMAIL_TAKEN` | ошибка у поля |
| Формат | 422 | `PHONE_INVALID`, `EMAIL_INVALID`, `PIN_INVALID` | ошибка у поля |
| Пароль | 422 | `PASSWORD_WEAK` (< 12 символов), `PASSWORD_LEAKED` | ошибка у поля |
| PIN не задан | 403 | `CRYPTO_SETUP_REQUIRED` | экран настройки PIN |
| 10 неудач фактора | 403 | `CRYPTO_LOCKED` | «обратитесь в поддержку» |

## 5. Правила сервера (так работает mock)

- **Вход.** 5 неудач за 15 минут на аккаунт и на IP → `429`. Каждый вход пишется в журнал.
  - Новое устройство → событие `new_device` с уведомлением клиенту.
  - Повторный вход на том же устройстве отзывает его прежний `sid`. Другие устройства не трогаются.
- **Ротация.** Принимается только `type=refresh`, не отозванный и с совпадающим `device_id`.
  - Старые access и refresh этого `sid` отзываются, выдаётся новая пара.
  - Crypto-токен при ротации не отзывается.
- **Кража.** Отозванный refresh предъявлен повторно → отзыв всего `sid` (включая crypto) и `403 TOKEN_REVOKED`. Оба участника уходят на вход.
- **Crypto-токен.**
  - `aud=crypto-api`; access на crypto-эндпоинтах не принимается.
  - Скользящий таймаут: `lastSeen` обновляется на каждом запросе.
  - Отзыв `sid` мгновенно делает crypto-токен недействительным: `403 TOKEN_REVOKED`.
- **Фактор.**
  - 3 ошибки подряд → блокировка на 15 минут. Основная сессия при этом работает.
  - 10 ошибок без успешного входа → `CRYPTO_LOCKED`.
  - PIN хранится как хеш; в проде — Argon2id.
- **Очистка.** Записи `issued_tokens` с истёкшим `exp` удаляются раз в час.

## 6. Клиент: где что лежит

```
src/auth/                      ядро сессии, без UI
  types.ts                     claims access/refresh/crypto, статусы, причины выхода
  jws.ts                       base64url, decodeJws, isExpired
  store.ts                     маленькое внешнее хранилище (React + код без React)
  session.ts                   сессия Уровня 1 в памяти: access, refresh, claims, статус
  cryptoSession.ts             crypto-токен в памяти, таймеры неактивности и предела, закрытие после 60 с в фоне
  sessionActions.ts            вход, single-flight refresh, выход, холодный старт, закрытие Crypto (через baseApi)
  secureStorage(.web).ts       Keychain/Keystore (web — localStorage): refresh, device_id, секрет Face ID
  deviceId.ts                  UUID установки, хранится в Keychain
  biometrics.ts                наличие Face ID / Touch ID, секрет за биометрией
  validation.ts                правила полей (общие для форм и mock-сервера)
  hooks.ts                     useSession, useCryptoSession, мутации входа, KYC, PIN, Face ID
src/api/
  client.ts                    HTTP-транспорт: Bearer по scope, разбор {code, attempts_left} и Retry-After
  services.ts                  контракт FlexApi, API_AUTH_SCOPE, baseApi (mock или HTTP)
  authInterceptor.ts           withAuth: заранее refresh, повтор после TOKEN_EXPIRED, выход, закрытие Crypto
  api.ts                       api = withAuth(baseApi) — им пользуются все хуки
  mock/auth/                   заглушка сервера: config, db (+ persist на диск), tokens, guards, handlers, devTools
src/providers/AuthProvider.tsx запуск сессии; очистка кэша при выходе и данных кошелька при закрытии Crypto
src/features/auth/             экраны: LoginForm, RegisterForm, VerifyCodeForm, CryptoGate,
                               KycPrompt, CryptoPinSetup, CryptoUnlock, PinPad, PinDots,
                               CryptoSecurityCard и AuthDebugCard (профиль)
app/(auth)/                    login, register, verify — доступны только без сессии
app/_layout.tsx                Stack.Protected: (tabs)/account/widget-gallery ↔ (auth)
app/(tabs)/crypto.tsx          всё ниже шапки — внутри <CryptoGate>
```

Правило импортов: внутри `src/api` и `src/auth/sessionActions.ts` используются прямые пути
(`@/auth/session`, `@/api/services`), а не индексы `@/auth` / `@/api`. Иначе появится цикл
`api → interceptor → sessionActions → api`.

## 7. Как проверить

Включить короткие сроки для ручной проверки: `src/api/mock/auth/config.ts → MOCK_AUTH_SHORT_TTL = true`
(access живёт 30 с, Crypto закрывается после 60 с без действий).

Демо-аккаунты, пароль у обоих `FlexDemo2026!`. На экране входа в dev-сборке есть чипы с ними.

| Аккаунт | Роль | Состояние |
|---|---|---|
| `pro@flex.by` | Pro | KYC одобрен, PIN ещё не задан |
| `basic@flex.by` | Basic | без KYC |

Код подтверждения — `000000`. Состояние mock-сервера хранится в `flex-mock-auth.json`, его можно сбросить из профиля.

В профиле в dev-сборке есть карточка «Отладка авторизации (mock)»: роль, `sid`, обратный отсчёт access и Crypto, журнал событий. Кнопки:
- «Истечь access»;
- «Украсть refresh»;
- «Отозвать сессию»;
- «Сбросить mock-БД».

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Холодный старт без сессии | экран входа |
| 2 | Неверный пароль | «Неверный логин или пароль». 6-я попытка → таймер `TOO_MANY_ATTEMPTS` |
| 3 | Регистрация → коды `000000` для SMS и почты | экран входа с плашкой «Аккаунт создан»; токенов при регистрации нет |
| 4 | Вход `basic@flex.by` → Crypto | предложение KYC. «Отправить заявку» → через 5 с роль pro (видно в отладке) и настройка PIN |
| 5 | Вход `pro@flex.by` → Crypto | настройка PIN дважды → предложение Face ID → стол |
| 6 | Перезапуск приложения | основная сессия жива (refresh из Keychain), Crypto снова просит PIN или Face ID |
| 7 | Три неверных PIN | «Слишком много попыток», таймер 15:00; Home и Cards работают |
| 8 | «Истечь access» | запросы продолжают работать, в журнале `refresh`, у access новый отсчёт |
| 9 | «Украсть refresh» | выход на экран входа с плашкой про безопасность; в журнале `refresh_reuse_detected` |
| 10 | Crypto открыт → «Отозвать сессию» | выход; crypto-токен недействителен сразу |
| 11 | Свернуть приложение больше чем на 60 с при открытом Crypto | Crypto закрыт, «Раздел закрылся, пока приложение было свёрнуто» |
| 12 | Профиль → «Выйти» | экран входа, кэш очищен, refresh удалён из Keychain |

Автоматически: `npm run typecheck` и сборка бандла (см. `docs/crypto-handoff.md`, §2).

## 8. Открытые вопросы

1. **`parent_jti` и ротация.**
   - Проблема: ТЗ привязывает crypto-токен к jti access, а access меняется каждые 15 минут. По букве ТЗ раздел закрывался бы при каждом тихом refresh.
   - Решение в mock: crypto-токен действителен, пока жив `sid`. `parent_jti` хранится для аудита.
   - Нужно согласовать с командой.
2. **Face ID.**
   - Сейчас: сервер выдаёт секрет устройства, клиент хранит его в Keychain с доступом только через биометрию.
   - По ТЗ: подпись challenge ключом из Secure Enclave / Android Keystore. Для этого нужен нативный модуль.
3. **Web.** Refresh должен быть в httpOnly + Secure + SameSite cookie, плюс CSRF-токен. Сейчас на web он лежит в `localStorage`, это только для разработки.
4. **Не входит в первую версию:**
   - TOTP как резервный фактор и сброс PIN;
   - смена PIN (`CRYPTO_ALREADY_CONFIGURED`);
   - подтверждение критичных операций (`/auth/crypto/confirm`);
   - список устройств;
   - certificate pinning.
5. **Юридические требования.** Требования законодательства РБ к хранению персональных данных — проверить с юристом.
