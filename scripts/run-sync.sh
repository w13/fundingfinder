#!/bin/bash
set -euo pipefail

API_BASE_URL="${GRANT_SENTINEL_API_URL:-https://grant-sentinel.wakas.workers.dev}"

if [ -z "${ADMIN_API_KEY:-}" ]; then
  echo "Warning: ADMIN_API_KEY not set. Request may be rejected if auth is enabled."
fi

echo "Triggering full sync..."

curl -s -X POST "${API_BASE_URL}/api/admin/run-sync" \
  -H "Content-Type: application/json" \
  ${ADMIN_API_KEY:+-H "Authorization: Bearer ${ADMIN_API_KEY}"} \
  -d '{}'
echo ""
