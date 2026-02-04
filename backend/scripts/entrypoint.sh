#!/bin/sh
# Merge seed files into public/uploads only if they don't exist (so runtime uploads from deployed app are preserved).
set -e
SEED_DIR="/app/uploads-seed"
UPLOADS_DIR="/app/public/uploads"
if [ -d "$SEED_DIR" ]; then
  mkdir -p "$UPLOADS_DIR"
  for f in "$SEED_DIR"/*; do
    [ -f "$f" ] || continue
    basename="${f##*/}"
    [ -f "$UPLOADS_DIR/$basename" ] && continue
    cp "$f" "$UPLOADS_DIR/$basename"
  done
fi
exec "$@"
