FROM mcr.microsoft.com/playwright:v1.57.0-noble AS base

RUN npm install --global pnpm@10.25.0

WORKDIR /apps

# Copy manifest first ─────────────────────────────────────────────────────
COPY worker/package.json worker/pnpm-lock.yaml ./worker/
COPY database/package.json database/pnpm-lock.yaml ./database/

# Install database Deps ─────────────────────────────────────────────────────
WORKDIR /apps/database
RUN pnpm install --frozen-lockfile

# Install All API Deps ─────────────────────────────────────────────────────
WORKDIR /apps/worker
RUN pnpm install --frozen-lockfile

# Copy Full Source ─────────────────────────────────────────────────────
WORKDIR /apps
COPY worker/ ./worker/
COPY database/ ./database/


# Build production bundle ─────────────────────────────────────────────────────
WORKDIR /apps/worker
RUN pnpm build

# Copy entrypoint: branches on NODE_ENV passed via `docker run -e NODE_ENV=""` ───────────
COPY worker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Health check port — curl is already available in the Playwright base image
EXPOSE 3001

# ECS task definition health check:
#   CMD-SHELL, curl -f http://localhost:3001/health || exit 1
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT [ "docker-entrypoint.sh" ]