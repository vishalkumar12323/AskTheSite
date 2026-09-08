FROM node:22-alpine AS base

RUN npm install --global pnpm@10.25.0

# ── Mirror the local monorepo layout: /apps/api + /apps/database ─────────────
# This is critical: tsconfig.json has rootDir: ".." which means the parent of
# api/ must contain BOTH api/ and database/ as siblings — exactly like locally.
WORKDIR /apps

# ── Copy manifests first (layer-cache friendly) ───────────────────────────────
COPY api/package.json api/pnpm-lock.yaml ./api/
COPY database/package.json database/pnpm-lock.yaml ./database/

# ── Install database deps ─────────────────────────────────────────────────────
WORKDIR /apps/database
RUN pnpm install --frozen-lockfile

# ── Install ALL API deps (devDeps kept for tsx in dev mode & tsc build) ───────
WORKDIR /apps/api
RUN pnpm install --frozen-lockfile

# ── Copy full source ──────────────────────────────────────────────────────────
WORKDIR /apps
COPY api/ ./api/
COPY database/ ./database/

# ── Build production bundle ───────────────────────────────────────────────────
# rootDir ".." = /apps  →  output: /apps/api/build/api/src/index.js
WORKDIR /apps/api
RUN pnpm build

# ── Runtime entrypoint: branches on NODE_ENV passed via `docker run -e` ───────
COPY api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --quiet --output-document=/dev/null \
  "http://localhost:${PORT:-8000}/api/health" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]