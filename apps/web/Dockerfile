FROM node:trixie-slim AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0

COPY web/package.json web/pnpm-lock.yaml ./

FROM base AS development
ENV NODE_ENV=development

COPY web ./

WORKDIR /app
RUN pnpm install

CMD [ "pnpm", "dev" ]