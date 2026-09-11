FROM node:22-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0
RUN apk add curl --no-cache

COPY web/package.json web/pnpm-lock.yaml ./

FROM base AS development
ENV NODE_ENV=development

COPY web/ ./

WORKDIR /app
RUN pnpm install

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD --no-verbose --tries=1, quiet --output-document=/dev/null "http://localhost:${PORT:-3000}/" || exit 1

CMD [ "pnpm", "dev" ]

FROM base AS builder
WORKDIR /app

COPY web/ ./
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD --no-verbose --tries=1, quiet --output-document=/dev/null "http://localhost:${PORT:-3000}/" || exit 1

CMD [ "node", "server.js" ]