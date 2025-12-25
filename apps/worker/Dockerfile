FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS base

# Install pnpm
RUN npm install -g pnpm@10.25.0

# Dependencies stage
FROM base AS deps
WORKDIR /app
RUN echo "node-linker=hoisted" > .npmrc

# Copy package files
COPY worker/package.json worker/pnpm-lock.yaml ./worker/
COPY database/package.json database/pnpm-lock.yaml ./database/

# Install dependencies for database
WORKDIR /app/database
RUN pnpm install --frozen-lockfile

WORKDIR /app/worker
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app ./

COPY worker ./worker
COPY database ./database

WORKDIR /app/worker
RUN pnpm build

# Runner stage
FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS runner
WORKDIR /app

ENV NODE_ENV production

# Install pnpm (needed if we use pnpm start, but we use node)
# We might need it if the app spawns pnpm? Unlikely using node dist/...

COPY --from=builder /app/worker/dist ./dist
COPY --from=builder /app/worker/node_modules ./node_modules
COPY --from=builder /app/worker/package.json ./package.json

# Note: Playwright browsers are in the base image.

CMD ["node", "dist/worker/src/index.js"]
