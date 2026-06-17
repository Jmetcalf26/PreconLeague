#!/bin/sh
set -e

echo "→ Applying database migrations…"
# Retries while Postgres finishes starting up on first boot.
n=0
until node node_modules/prisma/build/index.js migrate deploy; do
  n=$((n + 1))
  if [ "$n" -ge 10 ]; then
    echo "✗ Database did not become ready in time." >&2
    exit 1
  fi
  echo "  database not ready yet, retrying in 3s ($n/10)…"
  sleep 3
done

echo "→ Starting Precon League on port ${PORT:-3000}…"
# League defaults are created automatically on first request.
exec "$@"
