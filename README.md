# Flex — frontend

Мобильное и веб-приложение учебного криптобанка: счета, карты, криптопортфель и чат. React 19, React Native 0.86, Expo 57, TypeScript 6.

![Frontend CI](https://github.com/dsaveliy/flex-fe/actions/workflows/ci.yml/badge.svg)

## Запуск

Вся система через Docker — [быстрый старт backend](https://github.com/dsaveliy/flex-be#быстрый-старт). Этот репозиторий должен находиться рядом с `flex-be`.

Для разработки клиента установите Node.js 22 и npm:

```bash
npm ci
cp .env.example .env
npm run web
```

Без адреса API работают mock-данные. Для настоящего локального API укажите в `.env` `EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1` и перезапустите Expo. Откройте адрес, который напечатает Expo (обычно http://localhost:8081). На телефоне вместо localhost используйте доступный адрес сервера; для VPS — `https://flexbank.online/api/v1`.

## Проверки и сборка

```bash
npm run typecheck
npx expo export --platform web --output-dir dist
```

Нативная разработка: `npx expo run:ios` / `npx expo run:android`, затем `npx expo start --dev-client`. Используется dev-клиент, Expo Go не подходит. В Docker frontend собирается из Node 22 и раздаётся Caddy 2.

Проверка связки через браузер: `/status` показывает результат `GET /api/health` из БД через API. В Docker адрес API относительный, `/api/v1`.

## Где узнать больше

Единая документация проекта ведётся в **`flex-be/docs/`**:

- [Оглавление](https://github.com/dsaveliy/flex-be/blob/main/docs/README.md)
- [CONTRIBUTING — задачи, ветки, первый PR и ревью](https://github.com/dsaveliy/flex-be/blob/main/CONTRIBUTING.md)
- [Развёртывание и сеть](https://github.com/dsaveliy/flex-be/blob/main/docs/deployment.md)
- [OpenAPI](https://github.com/dsaveliy/flex-be/blob/main/api/openapi.yaml)
- [Локальные спецификации экранов и протоколов](docs/README.md)

Команда: Савелий Давыдович (Team Lead / PO, frontend, интеграция), Максим Камыно (frontend, Technical Writer), Родион Храмцов (backend, DevOps), Александр Кукулянский (backend, QA).
