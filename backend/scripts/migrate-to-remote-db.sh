#!/bin/bash
# Migrate schema to external (dcdeploy) database and update backend/.env
# Usage: ./migrate-to-remote-db.sh
# Or: REMOTE_DATABASE_URL='postgresql://...' ./migrate-to-remote-db.sh

set -e

cd "$(dirname "$0")/backend"

# External database URL (dcdeploy). Single quotes preserve password chars like { } ] )
if [ -z "$REMOTE_DATABASE_URL" ]; then
  REMOTE_DB_URL='postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db'
else
  REMOTE_DB_URL="$REMOTE_DATABASE_URL"
fi

echo "=========================================="
echo "Learning Buddy - Migrate to Remote DB"
echo "=========================================="
echo ""

echo "Step 1: Running migrations on remote database..."
REMOTE_DATABASE_URL="$REMOTE_DB_URL" node scripts/migrate-to-remote-db.js
echo ""

echo "=========================================="
echo "Done. backend/.env now points to remote DB."
echo "=========================================="
echo ""
echo "Optional: Copy existing local data to remote:"
echo "  LOCAL_DATABASE_URL='postgresql://localhost:5432/learning_buddy' \\"
echo "  REMOTE_DATABASE_URL='$REMOTE_DB_URL' \\"
echo "  node backend/scripts/migrate-data-to-remote.js"
echo ""
