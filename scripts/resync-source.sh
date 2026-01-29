#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <source_id> [--url <override_url>] [--max-notices <count>]"
  exit 1
fi

SOURCE_ID="$1"
shift

API_BASE_URL="${GRANT_SENTINEL_API_URL:-https://grant-sentinel.wakas.workers.dev}"
MAX_NOTICES=""
OVERRIDE_URL=""

while [ $# -gt 0 ]; do
  case "$1" in
    --max-notices)
      MAX_NOTICES="$2"
      shift 2
      ;;
    --url)
      OVERRIDE_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "${ADMIN_API_KEY:-}" ]; then
  echo "Warning: ADMIN_API_KEY not set. Request may be rejected if auth is enabled."
fi

payload="{"
if [ -n "$OVERRIDE_URL" ]; then
  payload="${payload}\"url\":\"${OVERRIDE_URL}\""
fi
if [ -n "$MAX_NOTICES" ]; then
  if [ "$payload" != "{" ]; then
    payload="${payload},"
  fi
  payload="${payload}\"maxNotices\":${MAX_NOTICES}"
fi
payload="${payload}}"

echo "Queuing sync for source: ${SOURCE_ID}"

curl -s -X POST "${API_BASE_URL}/api/admin/sources/${SOURCE_ID}/sync" \
  -H "Content-Type: application/json" \
  ${ADMIN_API_KEY:+-H "Authorization: Bearer ${ADMIN_API_KEY}"} \
  -d "${payload}"
echo ""
