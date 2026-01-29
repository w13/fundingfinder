#!/bin/bash
# Script to clean up "Unknown" entries from the database
# Usage: ./scripts/cleanup-unknown.sh

API_URL="https://grant-sentinel.wakas.workers.dev/api/admin/cleanup-unknown"

# Check if ADMIN_API_KEY is set
if [ -z "$ADMIN_API_KEY" ]; then
  echo "Error: ADMIN_API_KEY environment variable is not set"
  echo "Please set it with: export ADMIN_API_KEY=your_api_key"
  exit 1
fi

echo "Cleaning up 'Unknown' entries from Prozorro..."
response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d '{}')

echo "Response: $response"

# Check if the response contains an error
if echo "$response" | grep -q '"error"'; then
  echo "Error occurred during cleanup"
  exit 1
else
  echo "Cleanup completed successfully"
fi
