FROM node:18-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0

# Copy only the API package files so pnpm install works correctly for the API
COPY api/package.json api/pnpm-lock.yaml ./

FROM base AS development
ENV NODE_ENV=development

# The source code is mounted via docker-compose volumes, but we copy it for standalone builds
COPY api ./

# Install dependencies for the API
WORKDIR /app
RUN pnpm install

CMD [ "pnpm", "start:dev" ]