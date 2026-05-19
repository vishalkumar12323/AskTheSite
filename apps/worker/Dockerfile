FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0

# Copy only the worker package files so pnpm install works correctly for the worker
COPY worker/package.json worker/pnpm-lock.yaml ./

FROM base AS development
ENV NODE_ENV=development

# The source code is mounted via docker-compose volumes, but we copy it for standalone builds
COPY worker ./

# Install dependencies for the worker
WORKDIR /app
RUN pnpm install

CMD [ "pnpm", "start:dev" ]
