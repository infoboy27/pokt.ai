#!/bin/bash

# Load Test Script for Local PATH Gateway - Ethereum (ETH) Only
# Usage: ./run-load-test-local-path.sh [TARGET_RPS] [TOTAL_REQUESTS]
# Tests Ethereum chain only
# Uses: http://localhost:3069/v1/rpc with Target-Service-Id: eth header

set -e

# Configuration
TARGET_RPS=${1:-500}
TOTAL_REQUESTS=${2:-100000}
GATEWAY_URL=${GATEWAY_URL:-"http://localhost:3069/v1/rpc"}

echo "🚀 Starting Local PATH Gateway Load Test - Ethereum (ETH)"
echo ""
echo "Configuration:"
echo "  Target RPS: $TARGET_RPS"
echo "  Total Requests: $TOTAL_REQUESTS"
echo "  Gateway URL: $GATEWAY_URL"
echo "  Chain: Ethereum (ETH)"
echo ""

# Create results directory
mkdir -p load-test-results

# Test connectivity first (test with ETH chain)
echo "🔍 Testing Local PATH Gateway connectivity..."
if curl -s -X POST "$GATEWAY_URL" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  > /dev/null 2>&1; then
  echo "✅ Local PATH Gateway is reachable"
else
  echo "❌ Local PATH Gateway is not reachable at $GATEWAY_URL"
  echo "   Please check:"
  echo "   1. Is the PATH gateway running on port 3069?"
  echo "   2. Can you access http://localhost:3069/v1/rpc?"
  echo "   3. Check network connectivity"
  exit 1
fi

echo ""
echo "📊 Running Ethereum load test..."
echo "   Testing ETH chain at $TARGET_RPS RPS"
echo ""

# Run k6 load test
k6 run \
  --env TARGET_RPS=$TARGET_RPS \
  --env TOTAL_REQUESTS=$TOTAL_REQUESTS \
  --env GATEWAY_URL="$GATEWAY_URL" \
  load-test-local-path.js

echo ""
echo "✅ Load test complete!"
echo ""
echo "📄 HTML Report generated in: load-test-results/"
echo "   Open the latest HTML file in your browser to view the results"

