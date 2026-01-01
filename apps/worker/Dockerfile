FROM node:18-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0


COPY worker/package.json worker/pnpm-lock.yaml ./worker/
COPY database/package.json worker/pnpm-lock.yaml ./database/

FROM base AS development
ENV NODE_ENV=Development

COPY worker ./worker
COPY database ./database

WORKDIR /app/database
RUN pnpm install

WORKDIR /app/worker
RUN pnpm install


CMD [ "pnpm", "dev:watch" ]


