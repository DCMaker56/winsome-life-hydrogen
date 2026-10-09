#!/usr/bin/env bash
set -e
# Seed the persistent disk with the baked library on first boot; after that the
# disk owns the data (new variations, publish toggles) and survives redeploys.
if [ ! -f "$LIB_DIR/library.json" ]; then
  echo "Seeding $LIB_DIR from baked assets…"
  mkdir -p "$LIB_DIR"
  cp -a /app/generated/. "$LIB_DIR/"
fi
exec node library-server.mjs
