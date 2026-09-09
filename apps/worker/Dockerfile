FROM mcr.microsoft.com/playwright:v1.57.0-noble AS base

RUN npm install --global pnpm@10.25.0

WORKDIR /apps

# Copy manifest first ─────────────────────────────────────────────────────
COPY api/package.json api/pnpm-lock.yaml ./api/
COPY database/package.json database/pnpm-lock.yaml ./database/

# Install database Deps ─────────────────────────────────────────────────────
WORKDIR /apps/database
RUN pnpm install --frozen-lockfile

# Install All API Deps ─────────────────────────────────────────────────────
WORKDIR /apps/api
RUN pnpm install --frozen-lockfile

# Copy Full Source ─────────────────────────────────────────────────────
WORKDIR /apps
COPY api/ ./api/
COPY database/ ./database/


# Build production bundle ─────────────────────────────────────────────────────
WORKDIR /apps/api
RUN pnpm build

# Copy entrypoint: branches on NODE_ENV passed via `docker run -e NODE_ENV="" ───────────
COPY api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT [ "docker-entrypoint.sh" ]