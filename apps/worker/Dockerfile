FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS base

WORKDIR /app

RUN npm install -g pnpm@10.25.0

# Copy only the worker package files so pnpm install works correctly for the worker
COPY worker/package.json worker/pnpm-lock.yaml ./
# Copy database package files so we can install its dependencies
COPY database/package.json database/pnpm-lock.yaml /database/

FROM base AS development
ENV NODE_ENV=development

# Install dependencies for the database so module imports work correctly
WORKDIR /database
RUN pnpm install

# The source code is mounted via docker-compose volumes, but we copy it for standalone builds
WORKDIR /app
COPY worker ./

# Install dependencies for the worker
RUN pnpm install

CMD [ "pnpm", "start:dev" ]
