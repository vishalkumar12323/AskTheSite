# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

# ---------- Development ----------
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 4000
CMD ["pnpm", "dev:watch"]

# ---------- Build ----------
FROM base AS build
ENV NODE_ENV=production
RUN pnpm build

# ---------- Production ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["pnpm", "start"]
