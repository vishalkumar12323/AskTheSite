FROM node:18-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0

COPY api/package.json api/pnpm-lock.yaml ./api/
COPY database/package.json database/pnpm-lock.yaml  ./database/


FROM base AS development
ENV NODE_ENV=development

COPY api ./api
COPY database ./database

WORKDIR /app/database
RUN pnpm install

WORKDIR /app/api
RUN pnpm install

CMD [ "pnpm", "dev:watch" ]