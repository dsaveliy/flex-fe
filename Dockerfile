# веб-версия приложения: сборка Expo для браузера и раздача через Caddy.
# собирается из deploy/docker-compose.prod.yml репозитория flex-be (там же Caddyfile)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# адрес API вшивается при сборке; /api/v1 — тот же домен, что и у сайта
ARG EXPO_PUBLIC_API_URL=/api/v1
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_NO_TELEMETRY=1 \
    NODE_OPTIONS=--max-old-space-size=1536
RUN npx expo export --platform web --output-dir dist

FROM caddy:2-alpine
COPY --from=build /app/dist /srv/web
