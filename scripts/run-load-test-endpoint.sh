#!/bin/bash

# Load Test Script for pokt.ai Gateway Endpoints
# Usage: ./run-load-test-endpoint.sh [TARGET_RPS] [TOTAL_REQUESTS] [ENDPOINT_ID]
# Example: ./run-load-test-endpoint.sh 500 100000 eth_1760726811471_1760726811479

set -e

# Configuration
TARGET_RPS=${1:-500}
TOTAL_REQUESTS=${2:-100000}
ENDPOINT_ID=${3:-eth_1760726811471_1760726811479}
POKT_AI_GATEWAY_URL=${POKT_AI_GATEWAY_URL:-"https://pokt.ai/api/gateway"}

echo "🚀 Starting pokt.ai Gateway Endpoint Load Test"
echo ""
echo "Configuration:"
echo "  Endpoint ID: $ENDPOINT_ID"
echo "  Target RPS: $TARGET_RPS"
echo "  Total Requests: $TOTAL_REQUESTS"
echo "  Gateway URL: $POKT_AI_GATEWAY_URL"
echo ""

# Create results directory
mkdir -p load-test-results

# Test connectivity first
echo "🔍 Testing endpoint connectivity..."
TEST_URL="${POKT_AI_GATEWAY_URL}?endpoint=${ENDPOINT_ID}"
if curl -s -X POST "$TEST_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  > /dev/null 2>&1; then
  echo "✅ Endpoint is reachable"
else
  echo "❌ Endpoint is not reachable at $TEST_URL"
  echo "   Please check the endpoint ID and network connectivity"
  exit 1
fi

echo ""
echo "📊 Running load test..."
echo "   This will send $TOTAL_REQUESTS requests at $TARGET_RPS RPS"
echo ""

# Run k6 load test
k6 run \
  --env TARGET_RPS=$TARGET_RPS \
  --env TOTAL_REQUESTS=$TOTAL_REQUESTS \
  --env ENDPOINT_ID="$ENDPOINT_ID" \
  --env POKT_AI_GATEWAY_URL="$POKT_AI_GATEWAY_URL" \
  load-test-endpoint.js

echo ""
echo "✅ Load test complete!"
echo ""
echo "📄 HTML Report generated in: load-test-results/"
echo "   Open the latest HTML file in your browser to view the results"

