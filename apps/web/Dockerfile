FROM node:18-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0

COPY web/package.json web/pnpm-lock.yaml ./web/

FROM base AS development
ENV NODE_ENV=development

COPY web ./web

WORKDIR /app/web
RUN pnpm install

CMD [ "pnpm", "dev" ]