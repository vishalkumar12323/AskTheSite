FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.25.0

# Dependencies stage
FROM base AS deps
WORKDIR /app
RUN echo "node-linker=hoisted" > .npmrc

# Copy package files for api and database
COPY api/package.json api/pnpm-lock.yaml ./api/
COPY database/package.json database/pnpm-lock.yaml ./database/

# Install dependencies for database
WORKDIR /app/database
RUN pnpm install --frozen-lockfile

# Install dependencies for api
WORKDIR /app/api
RUN pnpm install --frozen-lockfile


# Development stage
FROM base AS development
WORKDIR /app
RUN echo "node-linker=hoisted" > .npmrc

COPY --from=deps /app ./
COPY api ./api
COPY database ./database

WORKDIR /app/api
RUN pnpm install

CMD [ "pnpm","dev:watch" ]

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app ./

# Copy source code
COPY api ./api
COPY database ./database

# Build api
WORKDIR /app/api
RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy built files and node_modules
# We need database/ dist or source? 
# The build output of api likely includes compiled database code if it was imported.
# api/tsconfig.json has outDir: dist and includes ../database
# So dist/ will contain the compiled code.
# The structure in dist will mimic the structure of rootDir (which is ..).
# So dist/api/src/index.js and dist/database/...

COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/api/node_modules ./node_modules
COPY --from=builder /app/api/package.json ./package.json

# We might need production deps only... but let's stick to simple copy for now.
# Pruning dev deps in a monorepo-like feel without workspace tools is tricky manually.
# Keeping it simple.

USER node

EXPOSE 8000

CMD ["node", "dist/api/src/index.js"]
