#!/bin/sh
set -e

# pnpm scripts are run from the api package directory
cd /apps/api

if [ "$NODE_ENV" = "development" ]; then
  echo "[entrypoint] Starting in DEVELOPMENT mode (tsx watch)..."
  exec pnpm start:dev
else
  echo "[entrypoint] Starting in PRODUCTION mode (node build/api/src/index.js)..."
  exec pnpm start:prod
fi
