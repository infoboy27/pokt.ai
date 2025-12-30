#!/bin/bash

# Direct PATH Gateway Load Test Script
# This bypasses Next.js and tests PATH gateway directly

set -e

# Configuration
TARGET_RPS="${TARGET_RPS:-2000}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-1000000}"
PATH_GATEWAY_URL="${PATH_GATEWAY_URL:-http://localhost:3069/v1}"
SERVICE_ID="${SERVICE_ID:-eth}"
APP_ADDRESS="${APP_ADDRESS:-pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv}"

echo "═══════════════════════════════════════════════════════════════"
echo "  PATH Gateway Direct Load Test"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  Target RPS: ${TARGET_RPS}"
echo "  Total Requests: ${TOTAL_REQUESTS}"
echo "  PATH Gateway URL: ${PATH_GATEWAY_URL}"
echo "  Service ID: ${SERVICE_ID}"
echo "  App Address: ${APP_ADDRESS}"
echo ""
echo "This test bypasses Next.js and tests PATH gateway directly."
echo ""

# Check if PATH gateway is accessible
echo "Checking PATH gateway health..."
if curl -s -f "${PATH_GATEWAY_URL}" -H "Content-Type: application/json" \
  -H "Target-Service-Id: ${SERVICE_ID}" \
  -H "App-Address: ${APP_ADDRESS}" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
  echo "✅ PATH gateway is accessible"
else
  echo "❌ PATH gateway is not accessible at ${PATH_GATEWAY_URL}"
  echo "   Please check if PATH gateway is running."
  exit 1
fi

echo ""
echo "Starting load test..."
echo ""

# Run k6 load test
k6 run \
  --env TARGET_RPS="${TARGET_RPS}" \
  --env TOTAL_REQUESTS="${TOTAL_REQUESTS}" \
  --env PATH_GATEWAY_URL="${PATH_GATEWAY_URL}" \
  --env SERVICE_ID="${SERVICE_ID}" \
  --env APP_ADDRESS="${APP_ADDRESS}" \
  load-test-path-direct.js

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Load test complete!"
echo "═══════════════════════════════════════════════════════════════"

