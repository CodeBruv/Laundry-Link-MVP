#!/bin/bash
set -e

pnpm install --frozen-lockfile --prefer-offline || pnpm install --frozen-lockfile

pnpm --filter db push 2>&1 | tee /tmp/db-push.log || true
if grep -q "No changes detected" /tmp/db-push.log; then
  echo "[post-merge] DB schema unchanged — skipping push."
fi
