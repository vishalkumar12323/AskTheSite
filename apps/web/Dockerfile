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

FROM base AS builder
WORKDIR /app

COPY web/ ./
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD [ "node", "server.js" ]