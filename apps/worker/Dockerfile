FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm install

COPY . .


FROM base AS development
ENV NODE_ENV=development

CMD [ "pnpm", "dev" ]


# Stage 3: Production build
FROM base AS builder
ENV NODE_ENV=producation

RUN pnpm build



# Stage 4: Producation (Runtime only)
FROM node:20-alpine AS prod
WORKDIR /app

ENV NODE_ENV=producation

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --omit-dev

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD [ "pnpm", "start" ]