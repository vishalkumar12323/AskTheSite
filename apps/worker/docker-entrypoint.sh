#!/bin/bash

set -e

# pnpm scripts run from the worker directory
cd /apps/worker

if [ "$NODE_ENV" = "development"]; then
    echo "[entrypoint] starting in DEVELOPMENT mode (tsx watch)...."
    exec pnpm start:dev
else
    echo "[entrypoint] starting in PRODUCTION mode (node build/worker/src/index.js)..."
    exec pnpm start:prod
fi
