# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build


# Stage 2: Production Run
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --only=production

COPY --from=builder /app/dist ./dist


CMD ["pnpm", "start"]